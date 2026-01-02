import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { formatDateWithWeekday, formatTime, getDateTimeInputValue, convertDateTimeLocalToUTC } from '../../utils/dateUtils';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import FilterBar from '../../components/Common/FilterBar';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  FaUserClock,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaClock,
  FaChartLine,
  FaQrcode,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTh,
  FaList,
  FaEdit
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AttendancePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [qrCode, setQrCode] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanToken, setScanToken] = useState('');
  const [employees, setEmployees] = useState([]);

  // Check if day filter is provided in URL (for today's attendance)
  const dayFromUrl = searchParams.get('day');
  const monthFromUrl = searchParams.get('month');
  const yearFromUrl = searchParams.get('year');

  const [filters, setFilters] = useState({
    month: monthFromUrl || new Date().getMonth().toString(),
    year: yearFromUrl || new Date().getFullYear().toString(),
    employee: '',
    day: dayFromUrl || ''
  });
  const [sortBy, setSortBy] = useState('date'); // 'date', 'employee', 'checkin'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({ timestamp: '', notes: '' });
  const [editLoading, setEditLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

  // Derived values from filters
  const selectedMonth = parseInt(filters.month) || new Date().getMonth();
  const selectedYear = parseInt(filters.year) || new Date().getFullYear();
  const selectedEmployee = filters.employee || '';

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
  }, [user]);

  // Sync URL params with filters state
  useEffect(() => {
    const dayParam = searchParams.get('day');
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    if (dayParam || monthParam || yearParam) {
      setFilters(prev => ({
        ...prev,
        month: monthParam || prev.month,
        year: yearParam || prev.year,
        day: dayParam || ''
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllAttendance();
      fetchAttendanceStats();
    } else {
      fetchMyAttendance();
    }
  }, [user, filters.month, filters.year, filters.employee, filters.day]);

  const fetchMyAttendance = async () => {
    try {
      const response = await api.get('/attendance/my-attendance');
      setMyAttendance(response.data.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Rate limit errors are already handled by API interceptor
      if (error.isRateLimit) {
        console.warn('Rate limit exceeded while fetching attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Fetch all employees (not just role='employee', but also check if we need all users)
      const response = await api.get('/users', { params: { role: 'employee' } });
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // If error, try to get all users and filter
      try {
        const allUsersResponse = await api.get('/users');
        const allUsers = allUsersResponse.data.data || [];
        const employeeUsers = allUsers.filter(u => u.role === 'employee');
        setEmployees(employeeUsers);
      } catch (fallbackError) {
        console.error('Error fetching all users:', fallbackError);
      }
    }
  };

  const fetchAllAttendance = async () => {
    try {
      setLoading(true);

      // Calculate date range - if day is specified, filter to that specific day only
      let startDate, endDate;
      if (filters.day) {
        // Filter to specific day
        const day = parseInt(filters.day);
        startDate = new Date(selectedYear, selectedMonth, day, 0, 0, 0);
        endDate = new Date(selectedYear, selectedMonth, day, 23, 59, 59);
      } else {
        // Filter to entire month (default behavior)
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      }

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      };

      if (selectedEmployee) {
        params.userId = selectedEmployee;
      }

      // Fetch all employees' attendance for admin/supervisor (grouped by date)
      const response = await api.get('/attendance/logs/grouped', { params });
      setAllAttendance(response.data.data || []);
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      // Rate limit errors are already handled by API interceptor
      if (error.isRateLimit) {
        console.warn('Rate limit exceeded while fetching all attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await api.get('/attendance/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Rate limit errors are already handled by API interceptor
      if (error.isRateLimit) {
        console.warn('Rate limit exceeded while fetching stats');
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      month: new Date().getMonth().toString(),
      year: new Date().getFullYear().toString(),
      employee: '',
      day: ''
    });
    // Clear URL params
    setSearchParams(new URLSearchParams());
  };

  const generateQRCode = async () => {
    try {
      const response = await api.get('/attendance/qr-code');
      setQrCode(response.data.data);

      // Auto-refresh QR code every 50 seconds
      setTimeout(() => {
        if (qrCode) generateQRCode();
      }, 50000);
    } catch (error) {
      console.error('Error generating QR code:', error);
      showError(t('attendance.errorGeneratingQR'));
    }
  };

  const handleCheckIn = async () => {
    if (!scanToken) {
      showWarning(t('attendance.enterToken'));
      return;
    }

    try {
      await api.post('/attendance/check-in', { token: scanToken });
      showSuccess(t('attendance.checkInSuccessful'));
      setScanToken('');
      fetchMyAttendance();
    } catch (error) {
      console.error('Error checking in:', error);
      // Rate limit errors are already handled by API interceptor
      if (!error.isRateLimit) {
        showError(error.response?.data?.message || t('attendance.checkInFailed'));
      }
    }
  };

  const handleCheckOut = async () => {
    if (!scanToken) {
      showWarning(t('attendance.enterToken'));
      return;
    }

    try {
      await api.post('/attendance/check-out', { token: scanToken });
      showSuccess(t('attendance.checkOutSuccessful'));
      setScanToken('');
      fetchMyAttendance();
    } catch (error) {
      console.error('Error checking out:', error);
      // Rate limit errors are already handled by API interceptor
      if (!error.isRateLimit) {
        showError(error.response?.data?.message || t('attendance.checkOutFailed'));
      }
    }
  };

  const handleEditAttendance = (log, type) => {
    if (!log || !log._id) return;

    setEditingLog({ id: log._id, type });
    setEditFormData({
      timestamp: getDateTimeInputValue(log.timestamp),
      notes: log.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    setEditLoading(true);
    try {
      // Convert datetime-local value (Saudi timezone) to UTC ISO string
      const payload = {
        ...editFormData,
        timestamp: editFormData.timestamp ? convertDateTimeLocalToUTC(editFormData.timestamp) : undefined
      };

      await api.put(`/attendance/logs/${editingLog.id}`, payload);
      showSuccess(t('attendance.updatedSuccessfully') || 'Attendance updated successfully');
      setEditingLog(null);
      setEditFormData({ timestamp: '', notes: '' });

      // Refresh attendance data
      if (isAdmin) {
        fetchAllAttendance();
      } else {
        fetchMyAttendance();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      showError(error.response?.data?.message || t('attendance.updateFailed') || 'Failed to update attendance');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <Loading />;

  // Calculate statistics based on role
  let attendanceData = isAdmin ? allAttendance : myAttendance;

  // Sort attendance data
  const sortedAttendance = [...attendanceData].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'date') {
      comparison = new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'employee') {
      const nameA = (a.userId?.name || a.checkin?.userId?.name || a.checkout?.userId?.name || '').toLowerCase();
      const nameB = (b.userId?.name || b.checkin?.userId?.name || b.checkout?.userId?.name || '').toLowerCase();
      comparison = nameA.localeCompare(nameB);
    } else if (sortBy === 'checkin') {
      const timeA = a.checkin ? new Date(a.checkin.timestamp).getTime() : 0;
      const timeB = b.checkin ? new Date(b.checkin.timestamp).getTime() : 0;
      comparison = timeA - timeB;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  attendanceData = sortedAttendance;

  // For employees: calculate personal stats
  // For admins: calculate company-wide stats from all attendance
  const totalDays = attendanceData.length;
  const completeDays = attendanceData.filter(r => r.checkin && r.checkout).length;
  const incompleteDays = attendanceData.filter(r => r.checkin && !r.checkout).length;

  // Calculate stats for the selected period (not just today)
  // Get unique employees who attended in the selected period
  const uniqueAttendedEmployees = new Set();
  attendanceData.forEach(record => {
    if (record.checkin) {
      // Try multiple ways to get userId
      let userId = null;

      if (record.userId) {
        userId = record.userId._id ? record.userId._id.toString() : record.userId.toString();
      } else if (record.checkin?.userId) {
        userId = record.checkin.userId._id ? record.checkin.userId._id.toString() : record.checkin.userId.toString();
      } else if (record.checkout?.userId) {
        userId = record.checkout.userId._id ? record.checkout.userId._id.toString() : record.checkout.userId.toString();
      }

      if (userId) {
        uniqueAttendedEmployees.add(userId);
      }
    }
  });
  const attendedCount = uniqueAttendedEmployees.size;

  // Get total employees (filter by selected employee if filter is active)
  const totalEmployees = selectedEmployee
    ? 1
    : employees.length;

  // Calculate attendance rate for the selected period
  const attendanceRate = totalEmployees > 0
    ? ((attendedCount / totalEmployees) * 100).toFixed(1)
    : '0.0';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaUserClock className="text-primary" />
              {t('attendance.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin
                ? t('attendance.trackCompanyAttendance')
                : t('attendance.trackYourAttendance')
              }
            </p>
          </div>
        </div>

        {/* Filters and Sorting for Admin/Supervisor */}
        {isAdmin && (
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            filterConfig={[
              {
                name: 'month',
                label: t('users.selectMonth'),
                allLabel: t('common.all'),
                options: Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(selectedYear, i, 1);
                  return {
                    value: i.toString(),
                    label: date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' })
                  };
                })
              },
              {
                name: 'year',
                label: t('attendance.year') || 'Year',
                allLabel: t('common.all'),
                options: Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return {
                    value: year.toString(),
                    label: year.toString()
                  };
                })
              },
              {
                name: 'employee',
                label: t('users.employee'),
                allLabel: t('common.all'),
                options: employees.map(emp => ({
                  value: emp._id,
                  label: emp.name
                }))
              }
            ]}
            showSort={true}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            sortOptions={[
              { value: 'date', label: t('forms.date') },
              { value: 'employee', label: t('users.employee') },
              { value: 'checkin', label: t('attendance.checkInTime') }
            ]}
          />
        )}

        {/* Statistics Cards */}
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {t('attendance.attendedEmployees') || 'Attended Employees'}
                  </p>
                  <p className="text-3xl font-bold text-green-600">{attendedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('attendance.outOf') || 'out of'} {totalEmployees} {t('attendance.employees') || 'employees'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {t('attendance.attendanceRate') || 'Attendance Rate'}
                  </p>
                  <p className="text-3xl font-bold text-primary">{attendanceRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('attendance.inSelectedPeriod') || 'In selected period'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FaChartLine className="text-2xl text-primary" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {t('attendance.totalRecords') || 'Total Records'}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">{totalDays}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('attendance.inSelectedPeriod') || 'In selected period'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FaCalendarAlt className="text-2xl text-blue-600" />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('attendance.totalDays')}</p>
                  <p className="text-3xl font-bold text-gray-900">{totalDays}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FaCalendarAlt className="text-2xl text-blue-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('templates.complete')}</p>
                  <p className="text-3xl font-bold text-green-600">{completeDays}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('attendance.incomplete')}</p>
                  <p className="text-3xl font-bold text-amber-600">{incompleteDays}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FaClock className="text-2xl text-amber-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('attendance.rate')}</p>
                  <p className="text-3xl font-bold text-primary">{attendanceRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FaChartLine className="text-2xl text-primary" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Check In/Out for Employees */}
        {/* {user?.role === 'employee' && (
          <Card title="Check In/Out">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Token (Scan or Enter)
                </label>
                <input
                  type="text"
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  placeholder="Enter token from QR code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex space-x-4">
                <Button onClick={handleCheckIn} fullWidth>
                  {t('attendance.checkIn')}
                </Button>
                <Button onClick={handleCheckOut} variant="secondary" fullWidth>
                  {t('attendance.checkOut')}
                </Button>
              </div>
            </div>
          </Card>
        )} */}

        {/* Attendance History */}
        <Card>
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <FaCalendarAlt className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  {isAdmin ? t('attendance.allAttendance') : t('attendance.myAttendance')}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {isAdmin
                    ? new Date(selectedYear, selectedMonth, 1).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })
                    : t('attendance.last30Days')
                  }
                </div>
                {/* View Toggle */}
                {attendanceData.length > 0 && (
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
                )}
              </div>
            </div>
          </div>

          {attendanceData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <FaUserClock className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('attendance.noAttendance')}
              </h3>
              <p className="text-gray-500 text-sm">
                {t('attendance.noAttendanceDescription')}
              </p>
            </div>
          ) : (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`bg-gray-50 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <tr>
                        {isAdmin && (
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('users.employee')}
                          </th>
                        )}
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('forms.date')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('attendance.checkInTime')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('attendance.checkOutTime')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('attendance.duration')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('forms.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {attendanceData.map((record, index) => {
                        // Calculate duration if both check-in and check-out exist
                        let duration = '-';
                        if (record.checkin && record.checkout) {
                          const checkInTime = new Date(record.checkin.timestamp);
                          const checkOutTime = new Date(record.checkout.timestamp);
                          const diffMs = checkOutTime - checkInTime;

                          // Ensure check-out is after check-in (should always be true now, but add safeguard)
                          if (diffMs >= 0) {
                            const hours = Math.floor(diffMs / (1000 * 60 * 60));
                            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            duration = `${hours}h ${minutes}m`;
                          } else {
                            // Fallback: should not happen, but handle gracefully
                            duration = 'Invalid';
                          }
                        }

                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            {isAdmin && (
                              <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/users/${record.userId._id}/analytics`)}>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-xs">
                                    {record.userId?.name?.charAt(0).toUpperCase() || record.checkin?.userId?.name?.charAt(0).toUpperCase() || record.checkout?.userId?.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {record.userId?.name || record.checkin?.userId?.name || record.checkout?.userId?.name || t('common.unknown')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {record.userId?.department || record.checkin?.userId?.department || record.checkout?.userId?.department || '-'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDateWithWeekday(record.date, i18n.language)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.checkin ? (
                                <div className="flex items-center gap-2">
                                  <FaClock className="text-green-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-900">
                                    {formatTime(record.checkin.timestamp, i18n.language)}
                                  </span>
                                  {user?.role === 'admin' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAttendance(record.checkin, 'checkin');
                                      }}
                                      className="p-1 text-primary hover:text-primary-dark transition-colors"
                                      title={t('common.edit') || 'Edit'}
                                    >
                                      <FaEdit className="text-xs" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.checkout ? (
                                <div className="flex items-center gap-2">
                                  <FaClock className="text-primary flex-shrink-0" />
                                  <span className="text-sm text-gray-900">
                                    {formatTime(record.checkout.timestamp, i18n.language)}
                                  </span>
                                  {user?.role === 'admin' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAttendance(record.checkout, 'checkout');
                                      }}
                                      className="p-1 text-primary hover:text-primary-dark transition-colors"
                                      title={t('common.edit') || 'Edit'}
                                    >
                                      <FaEdit className="text-xs" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {duration}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${record.checkin && record.checkout
                                  ? 'bg-green-100 text-green-800'
                                  : record.checkin
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-primary text-primary-darko'
                                  }`}
                              >
                                {record.checkin && record.checkout ? (
                                  <><FaCheckCircle /> {t('templates.complete')}</>
                                ) : record.checkin ? (
                                  <><FaClock /> {t('templates.checkedIn')}</>
                                ) : (
                                  <><FaTimesCircle /> {t('attendance.absent')}</>
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendanceData.map((record, index) => {
                      // Calculate duration if both check-in and check-out exist
                      let duration = '-';
                      if (record.checkin && record.checkout) {
                        const checkInTime = new Date(record.checkin.timestamp);
                        const checkOutTime = new Date(record.checkout.timestamp);
                        const diffMs = checkOutTime - checkInTime;

                        // Ensure check-out is after check-in (should always be true now, but add safeguard)
                        if (diffMs >= 0) {
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          duration = `${hours}h ${minutes}m`;
                        } else {
                          // Fallback: should not happen, but handle gracefully
                          duration = 'Invalid';
                        }
                      }

                      const employeeName = record.userId?.name || record.checkin?.userId?.name || record.checkout?.userId?.name || t('common.unknown');
                      const employeeDepartment = record.userId?.department || record.checkin?.userId?.department || record.checkout?.userId?.department || '-';
                      const employeeInitial = employeeName.charAt(0).toUpperCase();

                      return (
                        <div
                          key={index}
                          className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all ${isAdmin && record.userId?._id ? 'cursor-pointer' : ''}`}
                          onClick={isAdmin && record.userId?._id ? () => navigate(`/users/${record.userId._id}/analytics`) : undefined}
                        >
                          {/* Employee Info (Admin only) */}
                          {isAdmin && (
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-sm">
                                {employeeInitial}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {employeeName}
                                </h4>
                                <p className="text-xs text-gray-500">{employeeDepartment}</p>
                              </div>
                            </div>
                          )}

                          {/* Date */}
                          <div className="flex items-center gap-2 mb-3">
                            <FaCalendarAlt className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDateWithWeekday(record.date, i18n.language)}
                            </span>
                          </div>

                          {/* Check In/Out Times */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaClock className="text-green-500 flex-shrink-0 text-xs" />
                                <span className="text-xs text-gray-600">{t('attendance.checkInTime')}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {record.checkin
                                  ? formatTime(record.checkin.timestamp, i18n.language)
                                  : '-'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaClock className="text-primary flex-shrink-0 text-xs" />
                                <span className="text-xs text-gray-600">{t('attendance.checkOutTime')}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {record.checkout
                                  ? formatTime(record.checkout.timestamp, i18n.language)
                                  : '-'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-600">{t('attendance.duration')}</span>
                              <span className="text-sm font-semibold text-gray-900">{duration}</span>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="pt-3 border-t border-gray-100">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full w-full justify-center ${record.checkin && record.checkout
                                ? 'bg-green-100 text-green-800'
                                : record.checkin
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-primary text-primary-darko'
                                }`}
                            >
                              {record.checkin && record.checkout ? (
                                <><FaCheckCircle /> {t('templates.complete')}</>
                              ) : record.checkin ? (
                                <><FaClock /> {t('templates.checkedIn')}</>
                              ) : (
                                <><FaTimesCircle /> {t('attendance.absent')}</>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Edit Attendance Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {t('attendance.editAttendance') || 'Edit Attendance'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingLog.type === 'checkin'
                    ? (t('attendance.checkInTime') || 'Check In Time')
                    : (t('attendance.checkOutTime') || 'Check Out Time')}
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.timestamp}
                  onChange={(e) => setEditFormData({ ...editFormData, timestamp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('attendance.notes') || 'Notes'} ({t('common.optional') || 'Optional'})
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('attendance.notesPlaceholder') || 'Add notes...'}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingLog(null);
                  setEditFormData({ timestamp: '', notes: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={editLoading}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading || !editFormData.timestamp}
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

export default AttendancePage;

