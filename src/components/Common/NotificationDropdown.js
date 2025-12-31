import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaTimes, FaFileAlt, FaUserClock, FaUmbrellaBeach, FaUserPlus } from 'react-icons/fa';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';
import { formatDate } from '../../utils/dateUtils';
import Loading from './Loading';
import { usePolling } from '../../hooks/usePolling';

const NotificationDropdown = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const isRTL = i18n.language === 'ar';

  // Fetch notifications - memoized with useCallback
  const fetchNotifications = useCallback(async (showLoading = false) => {
    try {
      // Only show loading spinner when explicitly requested (e.g., when dropdown opens)
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get('/notifications?limit=10');
      setNotifications(response.data.data || []);

      // Fetch unread count
      const countResponse = await api.get('/notifications/unread-count');
      setUnreadCount(countResponse.data.data?.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      // Only set loading to false if we set it to true
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Mark as read
  const markAsRead = async (notificationId, e) => {
    e.stopPropagation();
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
  const markAllAsRead = async (e) => {
    e.stopPropagation();
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
  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      // Update unread count if deleted notification was unread
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
    return formatDate(date, i18n.language);
  };

  // Get notification icon based on type - memoized
  const getNotificationIcon = useCallback((type) => {
    const iconClass = 'text-primary';
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
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id, { stopPropagation: () => { } });
    }
    setIsOpen(false);

    // Navigate based on notification type
    if (notification.data?.formId) {
      navigate(`/forms/view/${notification.data.formId}`);
    } else if (notification.data?.leaveId) {
      navigate(`/leaves/${notification.data.leaveId}`);
    } else if (notification.data?.userId) {
      navigate(`/users/${notification.data.userId}/analytics`);
    } else {
      navigate('/notifications');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Show loading when dropdown opens
      fetchNotifications(true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, fetchNotifications]);

  // Initial fetch for unread count (without showing loading)
  useEffect(() => {
    fetchNotifications(false); // Fetch silently on mount to get unread count
  }, [fetchNotifications]);

  // Use optimized polling instead of setInterval
  // Create a wrapper that doesn't show loading spinner during polling updates
  const pollNotifications = useCallback(async () => {
    await fetchNotifications(false); // false = don't show loading spinner
  }, [fetchNotifications]);

  usePolling(
    pollNotifications,
    30000, // 30 seconds
    {
      enabled: true,
      immediate: false, // Don't call immediately, initial fetch handles it
      onError: (error) => {
        console.error('Error polling notifications:', error);
      }
    }
  );

  // Check screen size for mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 650);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => {
          // On mobile (under 650px), navigate to notifications page
          if (isMobile) {
            navigate('/notifications');
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={t('notifications.notifications')}
      >
        <FaBell className="text-gray-600 text-lg" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`absolute ${isRTL ? 'left-4' : 'right-4'} md:${isRTL ? 'left-0' : 'right-0'} mt-2 w-[calc(100vw-3rem)] sm:w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[500px] flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('notifications.notifications')}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                    title={t('notifications.markAllAsRead')}
                  >
                    <FaCheckDouble className="text-sm" />
                  </button>
                )}
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-xs text-primary hover:underline"
                >
                  {t('notifications.viewAll')}
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <FaBell className="text-gray-300 text-4xl mb-2" />
                  <p className="text-sm text-gray-500">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {typeof notification.title === 'object'
                                  ? (i18n.language === 'ar' ? notification.title.ar : notification.title.en)
                                  : notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {typeof notification.message === 'object'
                                  ? (i18n.language === 'ar' ? notification.message.ar : notification.message.en)
                                  : notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => markAsRead(notification._id, e)}
                                className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors"
                                title={t('notifications.markAsRead')}
                              >
                                <FaCheck className="text-xs" />
                              </button>
                            )}
                            <button
                              onClick={(e) => deleteNotification(notification._id, e)}
                              className="p-1 text-gray-400 hover:text-primary hover:bg-primary rounded transition-colors"
                              title={t('notifications.delete')}
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;

