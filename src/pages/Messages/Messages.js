import React, { useState, useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  FaEnvelope,
  FaEnvelopeOpen,
  FaPaperPlane,
  FaTrash,
  FaCheck,
  FaCheckDouble,
  FaUser,
  FaSearch,
  FaFilter,
  FaPlus,
  FaReply
} from 'react-icons/fa';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';
import { formatDateTime } from '../../utils/dateUtils';
import NewMessageModal from './NewMessageModal';
import MessageView from './MessageView';

const Messages = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('inbox'); // inbox, sent
  const [readFilter, setReadFilter] = useState('all'); // all, read, unread
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const isInitialLoad = React.useRef(true);

  // Fetch messages
  const fetchMessages = React.useCallback(async (showLoading = false) => {
    const shouldShowLoading = showLoading || isInitialLoad.current;
    try {
      // Only show loading spinner on initial load or when explicitly requested
      if (shouldShowLoading) {
        setLoading(true);
      }
      let response;

      if (filter === 'inbox') {
        const queryParams = readFilter !== 'all' ? `?read=${readFilter === 'read'}` : '';
        response = await api.get(`/messages${queryParams}`);
      } else {
        response = await api.get('/messages/sent');
      }

      setMessages(response.data.data || []);

      // Fetch unread count for inbox
      if (filter === 'inbox') {
        const countResponse = await api.get('/messages/unread-count');
        setUnreadCount(countResponse.data.data?.count || 0);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Only show error toast on initial load, not on silent polling updates
      if (isInitialLoad.current) {
        showError(t('messages.errorFetching'));
      }
    } finally {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
      // Only set loading to false if we set it to true
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, [filter, readFilter, t]);

  // Filter messages
  useEffect(() => {
    let filtered = messages;

    // Apply read filter for inbox
    if (filter === 'inbox' && readFilter !== 'all') {
      filtered = filtered.filter(m =>
        readFilter === 'read' ? m.read : !m.read
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.subject.toLowerCase().includes(term) ||
        m.content.toLowerCase().includes(term) ||
        (filter === 'inbox' && m.sender?.name?.toLowerCase().includes(term)) ||
        (filter === 'sent' && m.recipient?.name?.toLowerCase().includes(term))
      );
    }

    setFilteredMessages(filtered);
  }, [messages, filter, readFilter, searchTerm]);

  // Mark as read
  const markAsRead = async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/read`);
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, read: true, readAt: new Date() } : m
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
      showError(t('messages.errorMarkingRead'));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/messages/read-all');
      setMessages(prev =>
        prev.map(m => ({ ...m, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      showSuccess(t('messages.allMarkedAsRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      showError(t('messages.errorMarkingAllRead'));
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
      const deleted = messages.find(m => m._id === messageId);
      if (deleted && !deleted.read && filter === 'inbox') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      showSuccess(t('messages.deleted'));
      setShowDeleteDialog(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  // Format time using Saudi Arabia timezone
  const formatMessageTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('messages.justNow');
    if (diffMins < 60) return `${diffMins} ${t('messages.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('messages.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('messages.daysAgo')}`;
    return formatDateTime(date, i18n.language);
  };

  // Handle message click
  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    if (filter === 'inbox' && !message.read) {
      await markAsRead(message._id);
    }
  };

  // Initial load on component mount or when filter/readFilter changes
  React.useEffect(() => {
    isInitialLoad.current = true;
    fetchMessages(true); // true = show loading spinner on initial load
  }, [filter, readFilter, fetchMessages]);

  // Use optimized polling instead of setInterval
  // Create a wrapper that doesn't show loading spinner during polling updates
  const pollMessages = React.useCallback(async () => {
    await fetchMessages(false); // false = don't show loading spinner
  }, [fetchMessages]);

  usePolling(
    pollMessages,
    30000, // 30 seconds
    {
      enabled: true,
      immediate: false, // Don't call immediately, let the initial useEffect handle it
      onError: (error) => {
        console.error('Error polling messages:', error);
      }
    }
  );

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Messages List */}
        <div className="lg:col-span-1 flex flex-col">
          {/* Header */}
          <Card className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('messages.messages')}</h1>
                {filter === 'inbox' && unreadCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t('messages.unreadCount', { count: unreadCount })}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setShowNewMessageModal(true)}
                icon={FaPlus}
                className="w-full sm:w-auto"
              >
                {t('messages.newMessage')}
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setFilter('inbox');
                  setSelectedMessage(null);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${filter === 'inbox'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {t('messages.inbox')}
                {filter === 'inbox' && unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setFilter('sent');
                  setSelectedMessage(null);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'sent'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {t('messages.sent')}
              </button>
            </div>

            {/* Filters */}
            {filter === 'inbox' && (
              <div className="flex items-center gap-2 mt-4">
                <FaFilter className="text-gray-400" />
                <button
                  onClick={() => setReadFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${readFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {t('messages.all')}
                </button>
                <button
                  onClick={() => setReadFilter('unread')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${readFilter === 'unread'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {t('messages.unread')}
                </button>
                <button
                  onClick={() => setReadFilter('read')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${readFilter === 'read'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {t('messages.read')}
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative mt-4">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('messages.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {filter === 'inbox' && unreadCount > 0 && (
              <div className="mt-4">
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  icon={FaCheckDouble}
                  className="w-full text-sm"
                >
                  {t('messages.markAllAsRead')}
                </Button>
              </div>
            )}
          </Card>

          {/* Messages List */}
          <Card className="flex-1 overflow-hidden flex flex-col mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loading />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FaEnvelope className="text-gray-300 text-5xl mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm || readFilter !== 'all'
                    ? t('messages.noResults')
                    : t('messages.noMessages')}
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm || readFilter !== 'all'
                    ? t('messages.tryDifferentFilter')
                    : t('messages.noMessagesDesc')}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {filteredMessages.map((message) => (
                  <div
                    key={message._id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedMessage?._id === message._id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                      } ${!message.read && filter === 'inbox' ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {message.read || filter === 'sent' ? (
                          <FaEnvelopeOpen className="text-gray-400" />
                        ) : (
                          <FaEnvelope className="text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {filter === 'inbox'
                                ? message.sender?.name || t('messages.unknown')
                                : message.recipient?.name || t('messages.unknown')}
                            </p>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {message.subject}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                          {!message.read && filter === 'inbox' && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Message View */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <MessageView
              message={selectedMessage}
              onReply={() => {
                setShowNewMessageModal(true);
                // Pre-fill recipient if replying
              }}
              onDelete={() => {
                setMessageToDelete(selectedMessage);
                setShowDeleteDialog(true);
              }}
              isInbox={filter === 'inbox'}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <FaEnvelope className="text-gray-300 text-6xl mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {t('messages.selectMessage')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('messages.selectMessageDesc')}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onSend={() => {
          setShowNewMessageModal(false);
          fetchMessages(true); // Show loading when sending a new message
        }}
        replyTo={selectedMessage}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setMessageToDelete(null);
        }}
        onConfirm={() => deleteMessage(messageToDelete?._id)}
        title={t('messages.deleteMessage')}
        message={t('messages.confirmDelete')}
        confirmText={t('messages.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </Layout>
  );
};

export default Messages;

