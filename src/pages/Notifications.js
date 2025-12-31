import React, { useState, useEffect } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../utils/dateUtils';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaFileAlt,
  FaUserClock,
  FaUmbrellaBeach,
  FaUserPlus,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import Layout from '../components/Layout/Layout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Loading from '../components/Common/Loading';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, read, unread
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const isInitialLoad = React.useRef(true);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async (showLoading = false) => {
    const shouldShowLoading = showLoading || isInitialLoad.current;
    try {
      // Only show loading spinner on initial load or when explicitly requested
      if (shouldShowLoading) {
        setLoading(true);
      }
      const response = await api.get('/notifications?limit=100');
      setNotifications(response.data.data || []);

      // Fetch unread count
      const countResponse = await api.get('/notifications/unread-count');
      setUnreadCount(countResponse.data.data?.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Only show error toast on initial load, not on silent polling updates
      if (isInitialLoad.current) {
        showError(t('notifications.errorFetching'));
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
  }, [t]);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    // Apply read/unread filter
    if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, searchTerm]);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showError(t('notifications.errorMarkingRead'));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      showSuccess(t('notifications.allMarkedAsRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      showError(t('notifications.errorMarkingAllRead'));
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      const deleted = notifications.find(n => n._id === notificationId);
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      showSuccess(t('notifications.deleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      showError(t('notifications.errorDeleting'));
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setShowDeleteAllDialog(false);
      showSuccess(t('notifications.allDeleted'));
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      showError(t('notifications.errorDeletingAll'));
    }
  };

  // Format time using Saudi Arabia timezone
  const formatNotificationTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return `${diffMins} ${t('notifications.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('notifications.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('notifications.daysAgo')}`;
    return formatDateTime(date, i18n.language);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconClass = 'text-primary text-xl';
    switch (type) {
      case 'form_submitted':
      case 'form_approved':
      case 'form_rejected':
        return <FaFileAlt className={iconClass} />;
      case 'user_late':
      case 'user_absent':
        return <FaUserClock className={iconClass} />;
      case 'leave_requested':
      case 'leave_approved':
      case 'leave_rejected':
        return <FaUmbrellaBeach className={iconClass} />;
      case 'user_created':
        return <FaUserPlus className={iconClass} />;
      default:
        return <FaBell className={iconClass} />;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.data?.formId) {
      navigate(`/forms/view/${notification.data.formId}`);
    } else if (notification.data?.leaveId) {
      navigate(`/leaves/${notification.data.leaveId}`);
    } else if (notification.data?.userId) {
      navigate(`/users/${notification.data.userId}/analytics`);
    }
  };

  // Initial load on component mount
  React.useEffect(() => {
    fetchNotifications(true); // true = show loading spinner on initial load
  }, [fetchNotifications]);

  // Use optimized polling instead of setInterval
  // Create a wrapper that doesn't show loading spinner during polling updates
  const pollNotifications = React.useCallback(async () => {
    await fetchNotifications(false); // false = don't show loading spinner
  }, [fetchNotifications]);

  usePolling(
    pollNotifications,
    30000, // 30 seconds
    {
      enabled: true,
      immediate: false, // Don't call immediately, let the initial useEffect handle it
      onError: (error) => {
        console.error('Error polling notifications:', error);
      }
    }
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('notifications.notifications')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0
                ? t('notifications.unreadCount', { count: unreadCount })
                : t('notifications.allRead')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                icon={FaCheckDouble}
              >
                {t('notifications.markAllAsRead')}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={() => setShowDeleteAllDialog(true)}
                variant="outline"
                icon={FaTrash}
                className="text-primary hover:text-primary hover:border-primary"
              >
                {t('notifications.deleteAll')}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('notifications.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t('notifications.all')}
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t('notifications.unread')}
                {unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-white text-primary text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'read'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t('notifications.read')}
              </button>
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FaBell className="text-gray-300 text-5xl mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {searchTerm || filter !== 'all'
                  ? t('notifications.noResults')
                  : t('notifications.noNotifications')}
              </p>
              <p className="text-sm text-gray-500">
                {searchTerm || filter !== 'all'
                  ? t('notifications.tryDifferentFilter')
                  : t('notifications.noNotificationsDesc')}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                className={`cursor-pointer transition-all hover:shadow-md ${!notification.read ? 'border-l-4 border-l-primary bg-blue-50/30' : ''
                  }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {typeof notification.title === 'object'
                              ? (i18n.language === 'ar' ? notification.title.ar : notification.title.en)
                              : notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {typeof notification.message === 'object'
                            ? (i18n.language === 'ar' ? notification.message.ar : notification.message.en)
                            : notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <FaCheck className="text-xs" />
                          {t('notifications.markAsRead')}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-primary bg-primary hover:bg-primary rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <FaTrash className="text-xs" />
                        {t('notifications.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={deleteAllNotifications}
        title={t('notifications.deleteAll')}
        message={t('notifications.confirmDeleteAll')}
        confirmText={t('notifications.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </Layout>
  );
};

export default Notifications;

