import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { showSuccess, showError } from '../../utils/toast';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaFileAlt,
  FaUserCheck,
  FaEdit
} from 'react-icons/fa';

const ViewLeaveRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user: currentUser } = useAuth();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [editingLeave, setEditingLeave] = useState(false);
  const [editFormData, setEditFormData] = useState({ startDate: '', endDate: '', startTime: '', endTime: '' });
  const [editLoading, setEditLoading] = useState(false);
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchLeaveRequest();
  }, [id]);

  const fetchLeaveRequest = async () => {
    try {
      const response = await api.get(`/leaves/${id}`);
      setLeave(response.data.data);
    } catch (error) {
      console.error('Error fetching leave request:', error);
      showError(t('leaves.errorFetchingLeave'));
      navigate('/leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setApprovalAction('approved');
    setShowApprovalModal(true);
  };

  const handleReject = () => {
    setApprovalAction('rejected');
    setShowApprovalModal(true);
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: t('leaves.confirmCancel'),
      message: t('leaves.confirmCancelMessage'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      await api.put(`/leaves/${id}/cancel`);
      showSuccess(t('leaves.cancelledSuccessfully'));
      fetchLeaveRequest();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      showError(error.response?.data?.message || t('leaves.errorCancelling'));
    }
  };

  const handleEditLeave = () => {
    if (!leave) return;

    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    if (leave.type === 'permission') {
      // For permission, use date and time separately
      const dateStr = startDate.toISOString().split('T')[0];
      const startTimeStr = startDate.toTimeString().split(' ')[0].slice(0, 5);
      const endTimeStr = endDate.toTimeString().split(' ')[0].slice(0, 5);

      setEditFormData({
        startDate: dateStr,
        endDate: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr
      });
    } else {
      // For regular leaves, use full datetime
      const startStr = startDate.toISOString().slice(0, 16);
      const endStr = endDate.toISOString().slice(0, 16);

      setEditFormData({
        startDate: startStr,
        endDate: endStr,
        startTime: '',
        endTime: ''
      });
    }

    setEditingLeave(true);
  };

  const handleSaveLeaveEdit = async () => {
    if (!leave) return;

    setEditLoading(true);
    try {
      let submitData = {};

      if (leave.type === 'permission') {
        // For permission, combine date and time
        submitData.startDate = `${editFormData.startDate}T${editFormData.startTime}`;
        submitData.endDate = `${editFormData.endDate}T${editFormData.endTime}`;
      } else {
        // For regular leaves, use datetime directly
        submitData.startDate = editFormData.startDate;
        submitData.endDate = editFormData.endDate;
      }

      await api.put(`/leaves/${id}`, submitData);
      showSuccess(t('leaves.updatedSuccessfully') || 'Leave request updated successfully');
      setEditingLeave(false);
      fetchLeaveRequest();
    } catch (error) {
      console.error('Error updating leave:', error);
      showError(error.response?.data?.message || t('leaves.updateFailed') || 'Failed to update leave request');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-primary text-primary-darko border-primary';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'approved':
        return <FaCheckCircle className="text-green-600" />;
      case 'rejected':
        return <FaTimesCircle className="text-primary" />;
      case 'cancelled':
        return <FaInfoCircle className="text-gray-600" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateWithTime = (date) => {
    return new Date(date).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) return <Loading />;
  if (!leave) return null;

  const canApprove =
    (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') &&
    leave.status === 'pending';

  const canCancel =
    leave.userId._id === currentUser?.id &&
    leave.status === 'pending';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="secondary"
            icon={FaArrowLeft}
            onClick={() => navigate('/leaves')}
          >
            {t('common.back')}
          </Button>

          <div className="flex items-center gap-2">
            {canApprove && (
              <>
                <Button
                  variant="success"
                  icon={FaCheckCircle}
                  onClick={handleApprove}
                >
                  {t('leaves.approve')}
                </Button>
                <Button
                  variant="danger"
                  icon={FaTimesCircle}
                  onClick={handleReject}
                >
                  {t('leaves.reject')}
                </Button>
              </>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                icon={FaTimesCircle}
                onClick={handleCancel}
              >
                {t('leaves.cancel')}
              </Button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t('leaves.leaveRequestDetails')}</h1>
                <p className="text-white/80">ID: {leave._id}</p>
              </div>
              <div className={`px-6 py-3 rounded-lg border-2 ${getStatusColor(leave.status)} bg-white flex items-center gap-2`}>
                {getStatusIcon(leave.status)}
                <span className="text-lg font-bold">{t(`leaves.${leave.status}`)}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Employee Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-primary" />
                {t('leaves.employeeInformation')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {leave.userId.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('users.name')}</p>
                    <p className="text-lg font-semibold text-gray-900">{leave.userId.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaEnvelope className="text-gray-400 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{t('users.email')}</p>
                    <p className="text-lg font-semibold text-gray-900">{leave.userId.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaBriefcase className="text-gray-400 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{t('users.department')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {t(`departments.${leave.userId.department}`)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaFileAlt className="text-primary" />
                {t('leaves.leaveDetails')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leave Type */}
                <div className="border-l-4 border-primary pl-4">
                  <p className="text-sm text-gray-600 mb-1">{t('leaves.leaveType')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {t(`leaves.${leave.type}`)}
                  </p>
                </div>

                {/* Duration */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600 mb-1">{t('leaves.duration')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {leave.type === 'permission' ? (
                      <>
                        {(() => {
                          const start = new Date(leave.startDate);
                          const end = new Date(leave.endDate);
                          const diffTime = Math.abs(end - start);
                          const hours = (diffTime / (1000 * 60 * 60)).toFixed(2);
                          return `${hours} ${t('leaves.hours')} (${leave.days} ${t('leaves.days')})`;
                        })()}
                      </>
                    ) : (
                      `${leave.days} ${t('leaves.days')}`
                    )}
                  </p>
                </div>

                {/* Start Date */}
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">
                      {leave.type === 'permission' ? t('leaves.date') : t('leaves.startDate')}
                    </p>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={handleEditLeave}
                        className="p-1 text-primary hover:text-primary-dark transition-colors"
                        title={t('common.edit') || 'Edit'}
                      >
                        <FaEdit className="text-xs" />
                      </button>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaCalendarAlt className="text-green-600" />
                    {leave.type === 'permission' ? formatDateWithTime(leave.startDate) : formatDate(leave.startDate)}
                  </p>
                  {leave.type === 'permission' && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <FaClock className="text-green-600" />
                      {t('leaves.startTime')}: {formatTime(leave.startDate)}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {leave.type === 'permission' ? t('leaves.endTime') : t('leaves.endDate')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaCalendarAlt className="text-orange-600" />
                    {leave.type === 'permission' ? formatTime(leave.endDate) : formatDate(leave.endDate)}
                  </p>
                  {leave.type === 'permission' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(leave.endDate)}
                    </p>
                  )}
                </div>

                {/* Submission Date */}
                <div className="border-l-4 border-purple-500 pl-4 md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">{t('leaves.submittedOn')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDateTime(leave.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('leaves.reason')}</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-800 whitespace-pre-wrap">{leave.reason}</p>
              </div>
            </div>

            {/* Approval Information */}
            {leave.status !== 'pending' && leave.approvedBy && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUserCheck className="text-primary" />
                  {t('leaves.approvalInformation')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('leaves.approvedBy')}</p>
                    <p className="text-lg font-semibold text-gray-900">{leave.approvedBy.name}</p>
                    <p className="text-sm text-gray-600">{leave.approvedBy.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('leaves.approvalDate')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDateTime(leave.approvalDate)}
                    </p>
                  </div>
                  {leave.approvalNotes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-2">{t('leaves.approvalNotes')}</p>
                      <div className="bg-white rounded-lg p-4 border border-gray-300">
                        <p className="text-gray-800 whitespace-pre-wrap">{leave.approvalNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal
          leaveId={id}
          action={approvalAction}
          onClose={() => {
            setShowApprovalModal(false);
            setApprovalAction(null);
          }}
          onSuccess={() => {
            setShowApprovalModal(false);
            setApprovalAction(null);
            fetchLeaveRequest();
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
      {/* Edit Leave Modal */}
      {editingLeave && leave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {t('leaves.editLeaveRequest') || 'Edit Leave Request'}
            </h3>

            <div className="space-y-4">
              {leave.type === 'permission' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('leaves.date') || 'Date'}
                    </label>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('leaves.startTime') || 'Start Time'}
                      </label>
                      <input
                        type="time"
                        value={editFormData.startTime}
                        onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('leaves.endTime') || 'End Time'}
                      </label>
                      <input
                        type="time"
                        value={editFormData.endTime}
                        onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('leaves.startDate') || 'Start Date'}
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('leaves.endDate') || 'End Date'}
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingLeave(false);
                  setEditFormData({ startDate: '', endDate: '', startTime: '', endTime: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={editLoading}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSaveLeaveEdit}
                disabled={editLoading || !editFormData.startDate || (leave.type === 'permission' && (!editFormData.startTime || !editFormData.endTime))}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// Approval Modal Component
const ApprovalModal = ({ leaveId, action, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/leaves/${leaveId}/approve`, {
        status: action,
        notes
      });
      showSuccess(
        action === 'approved'
          ? t('leaves.approvedSuccessfully')
          : t('leaves.rejectedSuccessfully')
      );
      onSuccess();
    } catch (error) {
      console.error('Error updating leave request:', error);
      showError(error.response?.data?.message || t('leaves.errorUpdating'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className={`p-6 border-b border-gray-200 ${action === 'approved' ? 'bg-green-50' : 'bg-primary'
          }`}>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {action === 'approved' ? (
              <>
                <FaCheckCircle className="text-green-600" />
                {t('leaves.approveLeave')}
              </>
            ) : (
              <>
                <FaTimesCircle className="text-primary" />
                {t('leaves.rejectLeave')}
              </>
            )}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('leaves.notes')} ({t('common.optional')})
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('leaves.notesPlaceholder')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant={action === 'approved' ? 'success' : 'danger'}
            >
              {loading
                ? t('common.loading')
                : action === 'approved'
                  ? t('common.approve')
                  : t('common.reject')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewLeaveRequest;

