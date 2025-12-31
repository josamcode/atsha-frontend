import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import FilterBar from '../../components/Common/FilterBar';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { showSuccess, showError } from '../../utils/toast';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FaUsers,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaKey,
  FaUserCheck,
  FaUserTimes,
  FaTh,
  FaList
} from 'react-icons/fa';

const UsersList = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    department: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.department) params.department = filters.department;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/users', { params });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError(t('users.errorFetchingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleResetFilters = () => {
    setFilters({
      role: '',
      department: ''
    });
    setSearchTerm('');
  };

  const handleDelete = async (userId, userName) => {
    const confirmed = await confirm({
      title: t('users.confirmDelete'),
      message: t('users.confirmDeleteMessage', { name: userName }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/users/${userId}`);
      showSuccess(t('users.deleteSuccess'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError(error.response?.data?.message || t('users.deleteError'));
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const confirmed = await confirm({
      title: currentStatus ? t('users.deactivateUser') : t('users.activateUser'),
      message: currentStatus ? t('users.confirmDeactivate') : t('users.confirmActivate'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
      showSuccess(currentStatus ? t('users.deactivateSuccess') : t('users.activateSuccess'));
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showError(t('users.updateError'));
    }
  };

  const handleResetPassword = async (userId) => {
    setSelectedUserId(userId);
    setShowPasswordModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = async (user) => {
    try {
      // Fetch full user data including workDays and workSchedule
      const response = await api.get(`/users/${user._id}`);
      setEditingUser(response.data.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      showError(error.response?.data?.message || t('users.errorFetchingUser'));
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-primary text-primary-darko';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentLabel = (dept) => {
    return t(`departments.${dept}`) || dept;
  };

  if (loading) return <Loading />;

  const filteredUsers = users.filter(user =>
    searchTerm === '' ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaUsers className="text-primary" />
              {t('users.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('users.totalUsers')}: {users.length}
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <Button onClick={openCreateModal} icon={FaUserPlus}>
              {t('users.addUser')}
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          showSearch={true}
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onSearchSubmit={handleSearch}
          searchPlaceholder={t('users.searchPlaceholder')}
          filterConfig={[
            {
              name: 'role',
              label: t('users.filterByRole'),
              allLabel: t('common.allRoles'),
              options: [
                { value: 'admin', label: t('users.admin') },
                { value: 'supervisor', label: t('users.supervisor') },
                { value: 'employee', label: t('users.employee') }
              ]
            },
            {
              name: 'department',
              label: t('users.filterByDepartment'),
              allLabel: t('common.allDepartments'),
              options: [
                { value: 'kitchen', label: t('departments.kitchen') },
                { value: 'counter', label: t('departments.counter') },
                { value: 'cleaning', label: t('departments.cleaning') },
                { value: 'delivery', label: t('departments.delivery') },
                { value: 'management', label: t('departments.management') },
                { value: 'other', label: t('departments.other') }
              ]
            }
          ]}
        />

        {/* Users Table */}
        <Card>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('users.noUsers')}</p>
            </div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="mb-4 flex items-center justify-end px-6 pt-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded transition-all ${viewMode === 'table'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    title="Table View"
                  >
                    <FaList className="text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded transition-all ${viewMode === 'cards'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    title="Cards View"
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
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('users.name')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('users.email')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('users.role')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('users.department')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('users.status')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap  cursor-pointer"
                            onClick={() => currentUser?.role === 'admin' && navigate(`/users/${user._id}/analytics`)}
                          >
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <img
                                  src={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000'}${user.image}`}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold ${user.image ? 'hidden' : 'flex'}`}
                                style={{ display: user.image ? 'none' : 'flex' }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                {user.phone && (
                                  <div className="text-xs text-gray-500">{user.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs text-white leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {t(`users.${user.role}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getDepartmentLabel(user.department)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-primary text-primary-darko'
                              }`}>
                              {user.isActive !== false ? t('users.active') : t('users.inactive')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {currentUser?.role === 'admin' && (
                                <>
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                                    title={t('common.edit')}
                                  >
                                    <FaEdit />
                                  </button>

                                  <button
                                    onClick={() => handleToggleActive(user._id, user.isActive !== false)}
                                    className={`p-2 rounded transition-colors ${user.isActive !== false
                                      ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                      : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                      }`}
                                    title={user.isActive !== false ? t('users.deactivate') : t('users.activate')}
                                  >
                                    {user.isActive !== false ? <FaUserTimes /> : <FaUserCheck />}
                                  </button>

                                  <button
                                    onClick={() => handleResetPassword(user._id)}
                                    className="text-purple-600 hover:text-purple-900 p-2 rounded hover:bg-purple-50 transition-colors"
                                    title={t('users.resetPassword')}
                                  >
                                    <FaKey />
                                  </button>

                                  {user._id !== currentUser?._id && (
                                    <button
                                      onClick={() => handleDelete(user._id, user.name)}
                                      className="text-primary hover:text-primary p-2 rounded hover:bg-primary transition-colors"
                                      title={t('common.delete')}
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </>
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
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all ${currentUser?.role === 'admin' ? 'cursor-pointer' : ''}`}
                        onClick={() => currentUser?.role === 'admin' && navigate(`/users/${user._id}/analytics`)}
                      >
                        {/* User Header */}
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                          {user.image ? (
                            <img
                              src={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000'}${user.image}`}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${user.image ? 'hidden' : 'flex'}`}
                            style={{ display: user.image ? 'none' : 'flex' }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {user.name}
                            </h4>
                            {user.phone && (
                              <p className="text-xs text-gray-500">{user.phone}</p>
                            )}
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{t('users.email')}</span>
                            <span className="text-xs font-medium text-gray-900 truncate ml-2">{user.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{t('users.role')}</span>
                            <span className={`px-2 py-1 inline-flex text-xs text-white font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {t(`users.${user.role}`)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{t('users.department')}</span>
                            <span className="text-xs font-medium text-gray-900">{getDepartmentLabel(user.department)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-600">{t('users.status')}</span>
                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${user.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-primary text-primary-darko'
                              }`}>
                              {user.isActive !== false ? t('users.active') : t('users.inactive')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(user);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title={t('common.edit')}
                              >
                                <FaEdit className="text-sm" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(user._id, user.isActive !== false);
                                }}
                                className={`transition-colors ${user.isActive !== false
                                  ? 'text-orange-600 hover:text-orange-800'
                                  : 'text-green-600 hover:text-green-800'
                                  }`}
                                title={user.isActive !== false ? t('users.deactivate') : t('users.activate')}
                              >
                                {user.isActive !== false ? <FaUserTimes className="text-sm" /> : <FaUserCheck className="text-sm" />}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetPassword(user._id);
                                }}
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                                title={t('users.resetPassword')}
                              >
                                <FaKey className="text-sm" />
                              </button>

                              {user._id !== currentUser?._id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(user._id, user.name);
                                  }}
                                  className="text-primary hover:text-primary-darko transition-colors"
                                  title={t('common.delete')}
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <ResetPasswordModal
          userId={selectedUserId}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUserId(null);
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
    </Layout>
  );
};

// User Modal Component
const UserModal = ({ user, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    role: user?.role || 'employee',
    department: user?.department || 'other',
    languagePreference: user?.languagePreference || 'ar',
    leaveBalance: user?.leaveBalance || 0,
    workDays: user?.workDays || [],
    workSchedule: (() => {
      // Ensure workSchedule is always a proper object
      const schedule = user?.workSchedule;
      if (!schedule) return {};

      // If it's already an object and not an array, return it
      if (typeof schedule === 'object' && !Array.isArray(schedule) && schedule !== null) {
        // Clean up the schedule - ensure each day has proper structure
        const cleanedSchedule = {};
        Object.keys(schedule).forEach(day => {
          if (schedule[day] && typeof schedule[day] === 'object' && !Array.isArray(schedule[day])) {
            cleanedSchedule[day] = {
              startTime: schedule[day].startTime || '09:00',
              endTime: schedule[day].endTime || '17:00'
            };
          }
        });
        return cleanedSchedule;
      }

      // If it's corrupted (array, string, etc.), return empty object
      console.warn('Invalid workSchedule format detected, using empty object');
      return {};
    })(),
    nationality: user?.nationality || '',
    idNumber: user?.idNumber || '',
    jobTitle: user?.jobTitle || ''
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.image || null);

  // Update formData when user prop changes (e.g., when full user data is fetched)
  useEffect(() => {
    if (user) {
      const schedule = user?.workSchedule;
      let cleanedSchedule = {};

      if (schedule && typeof schedule === 'object' && !Array.isArray(schedule) && schedule !== null) {
        Object.keys(schedule).forEach(day => {
          if (schedule[day] && typeof schedule[day] === 'object' && !Array.isArray(schedule[day])) {
            cleanedSchedule[day] = {
              startTime: schedule[day].startTime || '09:00',
              endTime: schedule[day].endTime || '17:00'
            };
          }
        });
      }

      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        phone: user?.phone || '',
        role: user?.role || 'employee',
        department: user?.department || 'other',
        languagePreference: user?.languagePreference || 'ar',
        leaveBalance: user?.leaveBalance || 0,
        workDays: Array.isArray(user?.workDays) ? user.workDays : [],
        workSchedule: cleanedSchedule,
        nationality: user?.nationality || '',
        idNumber: user?.idNumber || '',
        jobTitle: user?.jobTitle || ''
      });

      setImagePreview(user?.image || null);
      setImageFile(null);
    }
  }, [user]);

  // Helper function to safely get workSchedule value
  const getScheduleValue = (day, field, defaultValue = '09:00') => {
    const schedule = typeof formData.workSchedule === 'object' && !Array.isArray(formData.workSchedule)
      ? formData.workSchedule
      : {};
    return schedule[day]?.[field] || defaultValue;
  };

  const handleDayToggle = (day) => {
    const isSelected = formData.workDays.includes(day);
    let newWorkDays;

    if (isSelected) {
      newWorkDays = formData.workDays.filter(d => d !== day);
      // Remove schedule for unselected day
      const currentSchedule = typeof formData.workSchedule === 'object' && !Array.isArray(formData.workSchedule)
        ? formData.workSchedule
        : {};
      const newSchedule = { ...currentSchedule };
      delete newSchedule[day];
      setFormData({ ...formData, workDays: newWorkDays, workSchedule: newSchedule });
    } else {
      newWorkDays = [...formData.workDays, day];
      // Add default schedule for new day
      const currentSchedule = typeof formData.workSchedule === 'object' && !Array.isArray(formData.workSchedule)
        ? formData.workSchedule
        : {};
      const newSchedule = { ...currentSchedule };
      newSchedule[day] = {
        startTime: currentSchedule[day]?.startTime || '09:00',
        endTime: currentSchedule[day]?.endTime || '17:00'
      };
      setFormData({ ...formData, workDays: newWorkDays, workSchedule: newSchedule });
    }
  };

  const handleScheduleChange = (day, field, value) => {
    // Ensure workSchedule is an object (not array)
    const currentSchedule = typeof formData.workSchedule === 'object' && !Array.isArray(formData.workSchedule)
      ? formData.workSchedule
      : {};
    const newSchedule = { ...currentSchedule };
    if (!newSchedule[day]) {
      newSchedule[day] = { startTime: '09:00', endTime: '17:00' };
    }
    newSchedule[day][field] = value;
    setFormData({ ...formData, workSchedule: newSchedule });
  };

  const handleApplyToAllDays = (field, value) => {
    // Ensure workSchedule is an object (not array)
    const currentSchedule = typeof formData.workSchedule === 'object' && !Array.isArray(formData.workSchedule)
      ? formData.workSchedule
      : {};
    const newSchedule = { ...currentSchedule };
    formData.workDays.forEach(day => {
      if (!newSchedule[day]) {
        newSchedule[day] = { startTime: '09:00', endTime: '17:00' };
      }
      newSchedule[day][field] = value;
    });
    setFormData({ ...formData, workSchedule: newSchedule });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Ensure workSchedule is a valid object before sending
      const workScheduleToSend = (() => {
        const schedule = formData.workSchedule;
        // Validate it's an object
        if (typeof schedule === 'object' && !Array.isArray(schedule) && schedule !== null) {
          // Clean up - only include valid day entries
          const cleaned = {};
          Object.keys(schedule).forEach(day => {
            if (schedule[day] && typeof schedule[day] === 'object' && !Array.isArray(schedule[day])) {
              cleaned[day] = {
                startTime: schedule[day].startTime || '09:00',
                endTime: schedule[day].endTime || '17:00'
              };
            }
          });
          return cleaned;
        }
        return {};
      })();

      Object.keys(formData).forEach(key => {
        if (key === 'workSchedule') {
          // Send as JSON string in FormData
          submitData.append(key, JSON.stringify(workScheduleToSend));
        } else if (Array.isArray(formData[key])) {
          formData[key].forEach(item => submitData.append(key, item));
        } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Add image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (user) {
        // Update existing user
        await api.put(`/users/${user._id}`, submitData);
        showSuccess(t('users.updateSuccess'));
      } else {
        // Create new user
        if (!formData.password) {
          showError(t('users.passwordRequired'));
          setLoading(false);
          return;
        }
        await api.post('/users', submitData);
        showSuccess(t('users.createSuccess'));
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      showError(error.response?.data?.message || t('users.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {user ? t('users.editUser') : t('users.addUser')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.name')} <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')} <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')} <span className="text-primary">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!user}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.nationality')}
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('users.nationality')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.idNumber')}
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('users.idNumber')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.jobTitle')}
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('users.jobTitle')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.image') || 'User Image'}
              </label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
                    <img
                      src={imagePreview.startsWith('data:') ? imagePreview : `${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000'}${imagePreview}`}
                      alt="User preview"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('users.imageHint') || 'Upload user profile image (JPEG, PNG, max 5MB)'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.role')} <span className="text-primary">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="employee">{t('users.employee')}</option>
                <option value="supervisor">{t('users.supervisor')}</option>
                <option value="admin">{t('users.admin')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.department')} <span className="text-primary">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="kitchen">{t('departments.kitchen')}</option>
                <option value="counter">{t('departments.counter')}</option>
                <option value="cleaning">{t('departments.cleaning')}</option>
                <option value="delivery">{t('departments.delivery')}</option>
                <option value="management">{t('departments.management')}</option>
                <option value="other">{t('departments.other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.language')}
              </label>
              <select
                value={formData.languagePreference}
                onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.leaveBalance')}
              </label>
              <input
                type="number"
                value={formData.leaveBalance}
                onChange={(e) => setFormData({ ...formData, leaveBalance: parseInt(e.target.value) })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Work Days and Schedule */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('users.workSchedule')}</h3>

            {/* Work Days Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('users.workDays')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.workDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{t(`users.${day}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule for Selected Days */}
            {formData.workDays.length > 0 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('users.workSchedule')}
                  </label>

                  {/* Apply to All Days */}
                  <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-700 mb-3">
                      {t('users.applyToAllDays') || 'Apply to All Selected Days'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('users.startTime')}
                        </label>
                        <input
                          type="time"
                          value={formData.workDays.length > 0 ? getScheduleValue(formData.workDays[0], 'startTime', '09:00') : '09:00'}
                          onChange={(e) => handleApplyToAllDays('startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('users.endTime')}
                        </label>
                        <input
                          type="time"
                          value={formData.workDays.length > 0 ? getScheduleValue(formData.workDays[0], 'endTime', '17:00') : '17:00'}
                          onChange={(e) => handleApplyToAllDays('endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('users.applyToAllDaysHint') || 'Change these times to apply to all selected days at once'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.workDays.map((day) => (
                    <div key={day} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3">{t(`users.${day}`)}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('users.startTime')}
                          </label>
                          <input
                            type="time"
                            value={getScheduleValue(day, 'startTime', '09:00')}
                            onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('users.endTime')}
                          </label>
                          <input
                            type="time"
                            value={getScheduleValue(day, 'endTime', '17:00')}
                            onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : (user ? t('common.update') : t('common.create'))}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reset Password Modal Component
const ResetPasswordModal = ({ userId, onClose }) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showError(t('users.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      showError(t('users.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await api.put(`/users/${userId}/reset-password`, { newPassword });
      showSuccess(t('users.passwordResetSuccess'));
      onClose();
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.response?.data?.message || t('users.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaKey className="text-primary" />
            {t('users.resetPassword')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users.newPassword')} <span className="text-primary">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users.confirmPassword')} <span className="text-primary">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('users.resetPassword')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersList;

