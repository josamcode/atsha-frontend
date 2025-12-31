import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import FilterBar from '../../components/Common/FilterBar';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { showSuccess, showError } from '../../utils/toast';
import { useConfirm } from '../../hooks/useConfirm';
import { FaCheckCircle, FaTimesCircle, FaBan, FaTrashAlt, FaPlus, FaUmbrellaBeach, FaCalendarCheck, FaHourglassHalf, FaEye, FaTh, FaList, FaCalendarAlt, FaClock } from 'react-icons/fa';

const LeavesList = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchLeaves();
    if (user?.role === 'employee') {
      fetchBalance();
    }
  }, [filters]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/leaves?${params.toString()}`);
      setLeaves(response.data.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await api.get('/leaves/my-balance');
      setBalance(response.data.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      type: ''
    });
    setSearchParams(new URLSearchParams());
  };

  const handleApprove = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/approve`, { status });
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave:', error);
      showError(t('leaves.errorUpdating'));
    }
  };

  const handleCancel = async (id) => {
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
      fetchLeaves();
    } catch (error) {
      console.error('Error canceling leave:', error);
      showError(t('leaves.errorCancelling'));
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: t('common.confirmDelete'),
      message: t('leaves.confirmDeleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/leaves/${id}`);
      showSuccess(t('leaves.deletedSuccessfully'));
      fetchLeaves();
    } catch (error) {
      console.error('Error deleting leave:', error);
      showError(t('leaves.errorDeleting'));
    }
  };

  if (loading) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('leaves.title')}</h1>
            <p className="text-gray-600 mt-1">{t('leaves.manageEmployeeLeaveRequests')}</p>
          </div>
          <Link to="/leaves/new">
            <Button className="flex items-center space-x-2">
              <FaPlus />
              <span>{t('leaves.requestLeave')}</span>
            </Button>
          </Link>
        </div>

        {/* Leave Balance (for employees) */}
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-l-4 border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('leaves.balance')}</p>
                  <p className="text-4xl font-bold text-primary">{balance.totalBalance}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('leaves.totalDays')}</p>
                </div>
                <FaUmbrellaBeach className="text-5xl text-primary opacity-50" />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('leaves.used')}</p>
                  <p className="text-4xl font-bold text-orange-600">{balance.usedDays}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('leaves.daysTaken')}</p>
                </div>
                <FaCalendarCheck className="text-5xl text-orange-500 opacity-50" />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('leaves.remaining')}</p>
                  <p className="text-4xl font-bold text-green-600">{balance.remainingDays}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('leaves.daysAvailable')}</p>
                </div>
                <FaHourglassHalf className="text-5xl text-green-500 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          filterConfig={[
            {
              name: 'status',
              label: t('leaves.status'),
              allLabel: t('common.all'),
              options: [
                { value: 'pending', label: t('leaves.pending') },
                { value: 'approved', label: t('leaves.approved') },
                { value: 'rejected', label: t('leaves.rejected') },
                { value: 'cancelled', label: t('leaves.cancelled') }
              ]
            },
            {
              name: 'type',
              label: t('leaves.leaveType'),
              allLabel: t('common.all'),
              options: [
                { value: 'vacation', label: t('leaves.vacation') },
                { value: 'sick', label: t('leaves.sick') },
                { value: 'permission', label: t('leaves.permission') },
                { value: 'emergency', label: t('leaves.emergency') },
                { value: 'unpaid', label: t('leaves.unpaid') }
              ]
            }
          ]}
        />

        {/* Leaves Table/Cards */}
        <Card>
          {leaves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('leaves.noLeaves')}
            </div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="mb-4 flex items-center justify-end">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded transition-all ${viewMode === 'table'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    title={t('common.tableView')}
                  >
                    <FaList className="text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded transition-all ${viewMode === 'cards'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    title={t('common.cardsView')}
                  >
                    <FaTh className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`bg-gray-50 ${t('language') === 'ar' ? 'text-right' : 'text-left'}`}>
                      <tr>
                        {(user?.role === 'admin' || user?.role === 'supervisor') && (
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                            {t('users.employee')}
                          </th>
                        )}
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('leaves.leaveType')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('leaves.startDate')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('leaves.endDate')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('leaves.days')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('leaves.status')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaves.map((leave) => (
                        <tr key={leave._id} className="hover:bg-gray-50">
                          {(user?.role === 'admin' || user?.role === 'supervisor') && (
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {leave.userId?.name || t('common.na')}
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {t(`leaves.${leave.type}`)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {leave.type === 'permission' ? (
                              <div>
                                <div>{formatDate(leave.startDate, i18n.language)}</div>
                                <div className="text-xs text-gray-400">
                                  {formatTime(leave.startDate, i18n.language)}
                                </div>
                              </div>
                            ) : (
                              formatDate(leave.startDate, i18n.language)
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {leave.type === 'permission' ? (
                              <div>
                                <div>{formatDate(leave.endDate, i18n.language)}</div>
                                <div className="text-xs text-gray-400">
                                  {formatTime(leave.endDate, i18n.language)}
                                </div>
                              </div>
                            ) : (
                              formatDate(leave.endDate, i18n.language)
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {leave.type === 'permission' ? (
                              <div>
                                <div>{(() => {
                                  const start = new Date(leave.startDate);
                                  const end = new Date(leave.endDate);
                                  const diffTime = Math.abs(end - start);
                                  const hours = (diffTime / (1000 * 60 * 60)).toFixed(2);
                                  return `${hours} ${t('leaves.hours')}`;
                                })()}</div>
                                <div className="text-xs text-gray-500">({leave.days} {t('leaves.days')})</div>
                              </div>
                            ) : (
                              leave.days
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${leave.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : leave.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : leave.status === 'rejected'
                                    ? 'bg-primary text-primary-darko'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {t(`leaves.${leave.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-x-3">
                              {/* View Button */}
                              <Link
                                to={`/leaves/${leave._id}`}
                                className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-all"
                                title={t('common.view')}
                              >
                                <FaEye className="text-xl" />
                              </Link>

                              {(user?.role === 'admin' || user?.role === 'supervisor') &&
                                leave.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(leave._id, 'approved')}
                                      className="text-green-600 hover:text-green-800 hover:scale-110 transition-all"
                                      title={t('leaves.approveLeave')}
                                    >
                                      <FaCheckCircle className="text-xl" />
                                    </button>
                                    <button
                                      onClick={() => handleApprove(leave._id, 'rejected')}
                                      className="text-primary hover:text-primary-darko hover:scale-110 transition-all"
                                      title={t('leaves.rejectLeave')}
                                    >
                                      <FaTimesCircle className="text-xl" />
                                    </button>
                                  </>
                                )}

                              {user?.id === leave.userId?._id &&
                                leave.status === 'pending' && (
                                  <button
                                    onClick={() => handleCancel(leave._id)}
                                    className="text-orange-600 hover:text-orange-800 hover:scale-110 transition-all"
                                    title={t('leaves.cancelLeave')}
                                  >
                                    <FaBan className="text-xl" />
                                  </button>
                                )}

                              {user?.id === leave.userId?._id && leave.status === 'pending' && (
                                <button
                                  onClick={() => handleDelete(leave._id)}
                                  className="text-primary hover:text-primary-darko hover:scale-110 transition-all"
                                  title={t('common.delete')}
                                >
                                  <FaTrashAlt className="text-xl" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leaves.map((leave) => (
                      <div
                        key={leave._id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all"
                      >
                        {/* Employee Info (Admin/Supervisor only) */}
                        {(user?.role === 'admin' || user?.role === 'supervisor') && (
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-sm">
                              {leave.userId?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {leave.userId?.name || t('common.na')}
                              </h4>
                              <p className="text-xs text-gray-500">{leave.userId?.department || '-'}</p>
                            </div>
                          </div>
                        )}

                        {/* Leave Type */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <FaUmbrellaBeach className="text-primary flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">
                              {t(`leaves.${leave.type}`)}
                            </span>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2 mb-3">
                          {leave.type === 'permission' ? (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-green-500 flex-shrink-0 text-xs" />
                                  <span className="text-xs text-gray-600">{t('leaves.date')}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(leave.startDate, i18n.language)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FaClock className="text-green-500 flex-shrink-0 text-xs" />
                                  <span className="text-xs text-gray-600">{t('leaves.startTime')}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatTime(leave.startDate, i18n.language)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FaClock className="text-primary flex-shrink-0 text-xs" />
                                  <span className="text-xs text-gray-600">{t('leaves.endTime')}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatTime(leave.endDate, i18n.language)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-600">{t('leaves.totalHours')}</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {(() => {
                                    const start = new Date(leave.startDate);
                                    const end = new Date(leave.endDate);
                                    const diffTime = Math.abs(end - start);
                                    const hours = (diffTime / (1000 * 60 * 60)).toFixed(2);
                                    return `${hours} ${t('leaves.hours')}`;
                                  })()}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-green-500 flex-shrink-0 text-xs" />
                                  <span className="text-xs text-gray-600">{t('leaves.startDate')}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(leave.startDate, i18n.language)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-primary flex-shrink-0 text-xs" />
                                  <span className="text-xs text-gray-600">{t('leaves.endDate')}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(leave.endDate, i18n.language)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-600">{t('leaves.days')}</span>
                                <span className="text-sm font-semibold text-gray-900">{leave.days} {t('leaves.days')}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Status */}
                        <div className="mb-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full w-full justify-center ${leave.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : leave.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : leave.status === 'rejected'
                                  ? 'bg-primary text-primary-darko'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {t(`leaves.${leave.status}`)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/leaves/${leave._id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title={t('common.view')}
                            >
                              <FaEye className="text-sm" />
                            </Link>

                            {(user?.role === 'admin' || user?.role === 'supervisor') &&
                              leave.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(leave._id, 'approved')}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                    title={t('leaves.approveLeave')}
                                  >
                                    <FaCheckCircle className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleApprove(leave._id, 'rejected')}
                                    className="text-primary hover:text-primary-darko transition-colors"
                                    title={t('leaves.rejectLeave')}
                                  >
                                    <FaTimesCircle className="text-sm" />
                                  </button>
                                </>
                              )}

                            {user?.id === leave.userId?._id &&
                              leave.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleCancel(leave._id)}
                                    className="text-orange-600 hover:text-orange-800 transition-colors"
                                    title={t('leaves.cancelLeave')}
                                  >
                                    <FaBan className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(leave._id)}
                                    className="text-primary hover:text-primary-darko transition-colors"
                                    title={t('common.delete')}
                                  >
                                    <FaTrashAlt className="text-sm" />
                                  </button>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog */}
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
    </Layout>
  );
};

export default LeavesList;

