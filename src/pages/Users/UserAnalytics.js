import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatTime as formatTimeSaudi, formatDate as formatDateSaudi, getDayName as getDayNameSaudi, SAUDI_TIMEZONE } from '../../utils/dateUtils';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import { showError } from '../../utils/toast';
import {
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarCheck,
  FaCalendarTimes,
  FaBed,
  FaUmbrellaBeach,
  FaExclamationTriangle,
  FaFileMedical,
  FaBan,
  FaDollarSign,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaIdBadge,
  FaSignInAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaFilePdf
} from 'react-icons/fa';

const UserAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [stats, setStats] = useState({
    attendance: {},
    leaves: {},
    late: {},
    workTime: {
      totalMinutes: 0,
      averageMinutes: 0,
      completeDays: 0
    },
    overtime: {
      totalMinutes: 0,
      averageMinutes: 0,
      completeDays: 0
    },
    paidDays: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/users');
      return;
    }
    fetchUserData();
  }, [id, selectedMonth, selectedYear]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user details
      const userResponse = await api.get(`/users/${id}`);
      const userData = userResponse.data.data;
      setUser(userData);

      // Calculate date range for selected month
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      // Fetch attendance data
      const attendanceResponse = await api.get('/attendance/logs', {
        params: {
          userId: id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        }
      });

      // Fetch grouped attendance for better analysis
      const attendanceGroupedResponse = await api.get('/attendance/logs/grouped', {
        params: {
          userId: id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        }
      });

      // Fetch leaves data
      const leavesResponse = await api.get('/leaves', {
        params: {
          userId: id,
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString()
        }
      });

      setAttendanceData(attendanceGroupedResponse.data.data || []);
      setLeavesData(leavesResponse.data.data || []);

      // Calculate statistics - pass userData to ensure we use fresh data
      calculateStats(attendanceGroupedResponse.data.data || [], leavesResponse.data.data || [], startDate, endDate, userData);

    } catch (error) {
      console.error('Error fetching user data:', error);

      // Handle rate limit errors (already shown by interceptor, but log it)
      if (error.isRateLimit) {
        // Error message already shown by API interceptor
        console.warn('Rate limit exceeded. Retry after:', error.retryAfter, 'seconds');
      } else {
        // Show generic error for other errors
        showError(error.response?.data?.message || t('users.errorLoadingUser'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get day name from date
  const getDayName = (date) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[date.getDay()];
  };

  // Helper function to parse time string (HH:MM) to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to get work schedule for a specific day
  const getDaySchedule = (dayName) => {
    // Ensure workSchedule is a valid object (not array or corrupted)
    const schedule = user?.workSchedule;
    if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) {
      return { startTime: '09:00', endTime: '17:00' }; // Default
    }
    if (!schedule[dayName] || typeof schedule[dayName] !== 'object' || Array.isArray(schedule[dayName])) {
      return { startTime: '09:00', endTime: '17:00' }; // Default
    }
    return {
      startTime: schedule[dayName].startTime || '09:00',
      endTime: schedule[dayName].endTime || '17:00'
    };
  };

  // Helper function to check if a day is a work day
  const isWorkDay = (dayName, userWorkDays) => {
    if (!userWorkDays || userWorkDays.length === 0) {
      // Default: Monday to Friday
      return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayName);
    }
    return userWorkDays.includes(dayName);
  };

  const calculateStats = (attendance, leaves, startDate, endDate, userData = null) => {
    // Use passed userData or fall back to state (for when called from useEffect)
    const currentUserData = userData || user;
    const userWorkDays = currentUserData?.workDays || [];
    // Calculate total days in month
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Build leave dates set for quick lookup
    const leaveDates = new Set();
    leaves.forEach(leave => {
      if (leave.status === 'approved') {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          leaveDates.add(dateStr);
        }
      }
    });

    // Build attendance map for quick lookup
    const attendanceMap = new Map();
    attendance.forEach(a => {
      if (a.date && a.checkin) {
        attendanceMap.set(a.date, a);
      }
    });

    // Get today's date for comparison (only count past days as absent)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Calculate statistics
    let workingDays = 0;
    let absentDays = 0;
    let nonWorkDays = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;
    let attendanceDays = 0;
    let totalWorkMinutes = 0; // Total actual work time in minutes
    let totalOvertimeMinutes = 0; // Total minutes after end shift (positive = overtime, negative = early leave)
    let completeDays = 0; // Days with both check-in and check-out

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayName = getDayName(date);
      // Create date string directly from year/month/day to match backend UTC format
      const year = selectedYear;
      const month = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      // Check if this date is in the future
      const isFutureDate = date > today;

      // Check if it's a work day
      if (!isWorkDay(dayName, userWorkDays)) {
        nonWorkDays++;
        continue;
      }

      // It's a work day
      workingDays++;

      // Check if on approved leave
      if (leaveDates.has(dateStr)) {
        continue; // Don't count as absent if on approved leave
      }

      // Check attendance
      const dayAttendance = attendanceMap.get(dateStr);
      if (dayAttendance && dayAttendance.checkin) {
        attendanceDays++;
        const checkinTime = new Date(dayAttendance.checkin.timestamp);
        const daySchedule = getDaySchedule(dayName);
        const expectedStartMinutes = timeToMinutes(daySchedule.startTime);
        const checkinMinutes = checkinTime.getHours() * 60 + checkinTime.getMinutes();

        // Check if late (after expected start time)
        if (checkinMinutes > expectedStartMinutes) {
          lateCount++;
          const lateMinutes = checkinMinutes - expectedStartMinutes;
          totalLateMinutes += lateMinutes;
        }

        // Calculate actual work time and overtime/early leave if check-out exists
        if (dayAttendance.checkout) {
          completeDays++;
          const checkoutTime = new Date(dayAttendance.checkout.timestamp);
          const checkoutMinutes = checkoutTime.getHours() * 60 + checkoutTime.getMinutes();

          // Calculate actual work time (check-out - check-in) in minutes
          const workMinutes = checkoutMinutes - checkinMinutes;
          totalWorkMinutes += workMinutes;

          // Calculate minutes after end shift (check-out time - scheduled end time)
          const expectedEndMinutes = timeToMinutes(daySchedule.endTime);
          const overtimeMinutes = checkoutMinutes - expectedEndMinutes;
          totalOvertimeMinutes += overtimeMinutes;
        }
      } else {
        // Only count as absent if the day has already passed (not future)
        if (!isFutureDate) {
          // Work day, not on leave, no attendance, and date has passed = absent
          absentDays++;
        }
        // Future days are not counted as absent - they are upcoming days
      }
    }

    // Calculate leaves by category
    const leavesByCategory = {};
    leaves.forEach(leave => {
      if (leave.status === 'approved') {
        if (!leavesByCategory[leave.type]) {
          leavesByCategory[leave.type] = { count: 0, days: 0 };
        }
        leavesByCategory[leave.type].count++;
        leavesByCategory[leave.type].days += leave.days || 0;
      }
    });

    // Calculate paid days (attendance + approved leaves)
    const paidDays = attendanceDays + leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.days || 0), 0);

    setStats({
      attendance: {
        total: attendanceDays,
        absent: absentDays,
        workingDays,
        nonWorkDays
      },
      leaves: {
        byCategory: leavesByCategory,
        total: leaves.filter(l => l.status === 'approved').length,
        totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.days || 0), 0)
      },
      late: {
        count: lateCount,
        totalMinutes: totalLateMinutes,
        averageMinutes: lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0
      },
      workTime: {
        totalMinutes: totalWorkMinutes,
        averageMinutes: completeDays > 0 ? Math.round(totalWorkMinutes / completeDays) : 0,
        completeDays: completeDays
      },
      overtime: {
        totalMinutes: totalOvertimeMinutes,
        averageMinutes: completeDays > 0 ? Math.round(totalOvertimeMinutes / completeDays) : 0,
        completeDays: completeDays
      },
      paidDays
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString(isRTL ? 'ar-US' : 'en-US', {
      timeZone: SAUDI_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Convert 24-hour time string (HH:MM) to 12-hour format
  const formatTime12Hour = (time24) => {
    if (!time24) return '-';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Format total late minutes to hours and minutes
  const formatLateTime = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return '0';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  // Format work time (hours and minutes)
  const formatWorkTime = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return '0h';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  // Format overtime/early leave (with + or - sign)
  const formatOvertime = (minutes) => {
    if (!minutes || minutes === 0) return '0m';
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes > 0 ? '+' : '-';
    if (hours > 0 && mins > 0) {
      return `${sign}${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${sign}${hours}h`;
    } else {
      return `${sign}${mins}m`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-US' : 'en-US', {
      timeZone: SAUDI_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      vacation: t('leaves.vacation'),
      sick: t('leaves.sick'),
      permission: t('leaves.permission'),
      emergency: t('leaves.emergency'),
      unpaid: t('leaves.unpaid'),
      other: t('leaves.other')
    };
    return labels[type] || type;
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      vacation: FaUmbrellaBeach,
      sick: FaFileMedical,
      permission: FaExclamationTriangle,
      emergency: FaExclamationTriangle,
      unpaid: FaBan,
      other: FaCalendarAlt
    };
    return icons[type] || FaCalendarAlt;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-primary text-primary-darko',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('users.userNotFound')}</p>
        </div>
      </Layout>
    );
  }

  const monthNames = isRTL
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/users')}
              variant="outline"
              icon={FaArrowLeft}
              className="hidden md:inline-flex"
            >
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t('users.userAnalytics')}</h1>
              <p className="text-gray-500 mt-1">{t('users.comprehensiveUserData')}</p>
            </div>
          </div>
          <div>
            <Button
              onClick={() => navigate(`/users/${id}/report`)}
              variant="primary"
              icon={FaFilePdf}
            >
              {t('users.viewReport')}
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-4xl font-bold">
              {user.image ? (
                <img src={`${((process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000'}${user.image}`} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaEnvelope className="text-primary" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-primary" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <FaBuilding className="text-primary" />
                  <span>{t(`departments.${user.department}`)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaIdBadge className="text-primary" />
                  <span>{t(`users.${user.role}`)}</span>
                </div>
                {user.jobTitle && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaIdBadge className="text-primary" />
                    <span>{user.jobTitle}</span>
                  </div>
                )}
              </div>

              {/* Work Schedule Info */}
              {user.workDays && user.workDays.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                    className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FaClock className="text-primary" />
                      <span className="text-sm font-semibold text-gray-700">{t('users.workSchedule')}</span>
                    </div>
                    {isScheduleOpen ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>

                  {isScheduleOpen && (
                    <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className={`bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <tr>
                              <th className={`px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('users.day')}
                              </th>
                              <th className={`px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('users.startTime')}
                              </th>
                              <th className={`px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('users.endTime')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {user.workDays.map((day) => {
                              const schedule = user.workSchedule?.[day] || { startTime: '09:00', endTime: '17:00' };
                              return (
                                <tr key={day} className="hover:bg-gray-50">
                                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t(`users.${day}`)}
                                  </td>
                                  <td className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {formatTime12Hour(schedule.startTime)}
                                  </td>
                                  <td className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {formatTime12Hour(schedule.endTime)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Month/Year Selector */}
        <Card>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">{t('users.selectMonth')}:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Attendance */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.totalAttendance')}</p>
                <p className="text-3xl font-bold text-gray-800">{stats.attendance.total}</p>
                <p className="text-xs text-gray-500 mt-1">{t('users.days')}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <FaCheckCircle className="text-3xl text-green-600" />
              </div>
            </div>
          </Card>

          {/* Total Absent */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.totalAbsent')}</p>
                <p className="text-3xl font-bold text-gray-800">{stats.attendance.absent}</p>
                <p className="text-xs text-gray-500 mt-1">{t('users.days')}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <FaTimesCircle className="text-3xl text-primary" />
              </div>
            </div>
          </Card>

          {/* Non-Work Days */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.nonWorkDays') || 'Non-Work Days'}</p>
                <p className="text-3xl font-bold text-gray-800">{stats.attendance.nonWorkDays}</p>
                <p className="text-xs text-gray-500 mt-1">{t('users.days')}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FaCalendarAlt className="text-3xl text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Total Late Time */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.totalLateTime') || 'Total Late Time'}</p>
                <p className="text-3xl font-bold text-gray-800">{formatLateTime(stats.late.totalMinutes)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.late.count > 0
                    ? `${stats.late.count} ${t('users.times') || 'times'}`
                    : t('users.noLate') || 'No late arrivals'
                  }
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <FaClock className="text-3xl text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Work Time & Overtime Statistics */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          Total Work Time
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.totalWorkTime') || 'Total Work Time'}</p>
                <p className="text-3xl font-bold text-gray-800">{formatWorkTime(stats.workTime.totalMinutes)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.workTime.completeDays > 0
                    ? `${stats.workTime.completeDays} ${t('users.completeDays') || 'complete days'}`
                    : t('users.noCompleteDays') || 'No complete days'
                  }
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaClock className="text-3xl text-indigo-600" />
              </div>
            </div>
          </Card>

          Average Work Time
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.averageWorkTime') || 'Average Work Time'}</p>
                <p className="text-3xl font-bold text-gray-800">{formatWorkTime(stats.workTime.averageMinutes)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('users.perDay') || 'per day'}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <FaChartLine className="text-3xl text-purple-600" />
              </div>
            </div>
          </Card>

          Total Overtime/Early Leave
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.totalOvertime') || 'Total Overtime/Early Leave'}</p>
                <p className={`text-3xl font-bold ${stats.overtime.totalMinutes >= 0 ? 'text-green-600' : 'text-primary'}`}>
                  {formatOvertime(stats.overtime.totalMinutes)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.overtime.totalMinutes >= 0
                    ? t('users.overtime') || 'Overtime'
                    : t('users.earlyLeave') || 'Early Leave'
                  }
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${stats.overtime.totalMinutes >= 0 ? 'bg-green-100' : 'bg-primary'}`}>
                <FaClock className={`text-3xl ${stats.overtime.totalMinutes >= 0 ? 'text-green-600' : 'text-primary'}`} />
              </div>
            </div>
          </Card>

          Average Overtime/Early Leave
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.averageOvertime') || 'Average Overtime/Early Leave'}</p>
                <p className={`text-3xl font-bold ${stats.overtime.averageMinutes >= 0 ? 'text-green-600' : 'text-primary'}`}>
                  {formatOvertime(stats.overtime.averageMinutes)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('users.perDay') || 'per day'}</p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${stats.overtime.averageMinutes >= 0 ? 'bg-green-100' : 'bg-primary'}`}>
                <FaChartLine className={`text-3xl ${stats.overtime.averageMinutes >= 0 ? 'text-green-600' : 'text-primary'}`} />
              </div>
            </div>
          </Card>
        </div> */}

        {/* Late Statistics */}
        <Card>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaClock className="text-primary" />
            {t('users.lateStatistics')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">{t('users.lateCount')}</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.late.count}</p>
              <p className="text-xs text-gray-500 mt-1">{t('users.times')}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">{t('users.totalLateMinutes')}</p>
              <p className="text-3xl font-bold text-orange-600">{stats.late.totalMinutes}</p>
              <p className="text-xs text-gray-500 mt-1">{t('users.minutes')}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">{t('users.averageLateMinutes')}</p>
              <p className="text-3xl font-bold text-primary">{stats.late.averageMinutes}</p>
              <p className="text-xs text-gray-500 mt-1">{t('users.minutes')}</p>
            </div>
          </div>
        </Card>

        {/* Leaves by Category */}
        <Card>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartPie className="text-primary" />
            {t('users.leavesByCategory')}
          </h3>
          {Object.keys(stats.leaves.byCategory).length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('users.noLeavesThisMonth')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.leaves.byCategory).map(([type, data]) => {
                const Icon = getLeaveTypeIcon(type);
                return (
                  <div key={type} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="text-2xl text-primary" />
                      <span className="font-semibold text-gray-800">{getLeaveTypeLabel(type)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t('users.requests')}:</span>
                      <span className="font-bold text-gray-800">{data.count}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-500">{t('users.days')}:</span>
                      <span className="font-bold text-gray-800">{data.days}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Attendance Calendar */}
        <Card>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaCalendarCheck className="text-primary" />
            {t('users.dailyAttendance')} - {monthNames[selectedMonth]} {selectedYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`bg-gray-50 ${isRTL ? 'text-right' : 'text-left'}`}>
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.date')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.day')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.checkIn')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.checkOut')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.workTime') || 'Work Time'}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.overtime') || 'Overtime/Early'}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.status')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('users.late')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(selectedYear, selectedMonth, day);
                  // Create date string directly from year/month/day to match backend UTC format
                  const year = selectedYear;
                  const month = String(selectedMonth + 1).padStart(2, '0');
                  const dayStr = String(day).padStart(2, '0');
                  const dateStr = `${year}-${month}-${dayStr}`;
                  const dayName = getDayName(date);
                  const isWorkDayToday = isWorkDay(dayName, user?.workDays);
                  const daySchedule = getDaySchedule(dayName);
                  // Find attendance for this date (userId filter is handled by backend, but double-check)
                  const dayAttendance = attendanceData.find(a => {
                    if (a.date !== dateStr) return false;
                    // If userId is present in the record, ensure it matches (for safety)
                    if (a.userId) {
                      const recordUserId = a.userId._id ? a.userId._id.toString() : a.userId.toString();
                      return recordUserId === user?._id || recordUserId === id;
                    }
                    return true; // If no userId in record, assume it's for this user (legacy data)
                  });

                  // Check if this date is in the future
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isFutureDate = date > today;

                  const isOnLeave = leavesData.some(l => {
                    if (l.status !== 'approved') return false;
                    const start = new Date(l.startDate).toISOString().split('T')[0];
                    const end = new Date(l.endDate).toISOString().split('T')[0];
                    return dateStr >= start && dateStr <= end;
                  });

                  let status = 'absent';
                  let statusColor = 'bg-primary text-white';
                  let statusText = t('users.absent');

                  if (!isWorkDayToday) {
                    status = 'nonWorkDay';
                    statusColor = 'bg-blue-100 text-blue-800';
                    statusText = t('users.nonWorkDay') || 'Non-Work Day';
                  } else if (isFutureDate) {
                    status = 'upcoming';
                    statusColor = 'bg-gray-100 text-gray-600';
                    statusText = t('users.upcoming') || 'Upcoming';
                  } else if (isOnLeave) {
                    status = 'leave';
                    statusColor = 'bg-purple-100 text-purple-800';
                    statusText = t('users.onLeave');
                  } else if (dayAttendance && dayAttendance.checkin) {
                    status = 'present';
                    statusColor = 'bg-green-100 text-green-800';
                    statusText = t('users.present');
                  }

                  const checkinTime = dayAttendance?.checkin ? new Date(dayAttendance.checkin.timestamp) : null;
                  const checkoutTime = dayAttendance?.checkout ? new Date(dayAttendance.checkout.timestamp) : null;

                  // Calculate late time based on actual schedule
                  let isLate = false;
                  let lateMinutes = 0;
                  if (checkinTime && isWorkDayToday) {
                    const expectedStartMinutes = timeToMinutes(daySchedule.startTime);
                    const checkinMinutes = checkinTime.getHours() * 60 + checkinTime.getMinutes();
                    if (checkinMinutes > expectedStartMinutes) {
                      isLate = true;
                      lateMinutes = checkinMinutes - expectedStartMinutes;
                    }
                  }

                  // Calculate work time and overtime/early leave
                  let workTimeMinutes = null;
                  let overtimeMinutes = null;
                  if (checkinTime && checkoutTime && isWorkDayToday) {
                    const checkinMinutes = checkinTime.getHours() * 60 + checkinTime.getMinutes();
                    const checkoutMinutes = checkoutTime.getHours() * 60 + checkoutTime.getMinutes();
                    workTimeMinutes = checkoutMinutes - checkinMinutes;

                    const expectedEndMinutes = timeToMinutes(daySchedule.endTime);
                    overtimeMinutes = checkoutMinutes - expectedEndMinutes;
                  }

                  return (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {day} {monthNames[selectedMonth]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {date.toLocaleDateString(isRTL ? 'ar-US' : 'en-US', { timeZone: SAUDI_TIMEZONE, weekday: 'short' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {checkinTime ? (
                          <div className="flex items-center gap-2">
                            <FaSignInAlt className="text-green-500" />
                            {formatTime(checkinTime)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {checkoutTime ? (
                          <div className="flex items-center gap-2">
                            <FaSignOutAlt className="text-primary" />
                            {formatTime(checkoutTime)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {workTimeMinutes !== null ? (
                          <span className="font-medium">{formatWorkTime(workTimeMinutes)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {overtimeMinutes !== null ? (
                          <span className={`font-medium ${overtimeMinutes >= 0 ? 'text-green-600' : 'text-primary'}`}>
                            {formatOvertime(overtimeMinutes)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {isLate ? (
                          <div>
                            <span className="text-primary font-semibold">
                              {lateMinutes} {t('users.minutes')}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('users.expected') || 'Expected'}: {daySchedule.startTime}
                            </p>
                          </div>
                        ) : isWorkDayToday ? (
                          <p className="text-xs text-gray-500">
                            {t('users.expected') || 'Expected'}: {daySchedule.startTime}
                          </p>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Leaves List */}
        <Card>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaBed className="text-primary" />
            {t('users.leaveRequests')} - {monthNames[selectedMonth]} {selectedYear}
          </h3>
          {leavesData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('users.noLeaveRequests')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leaves.leaveType')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leaves.startDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leaves.endDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leaves.days')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leaves.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leaves.reason')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leavesData.map((leave) => {
                    const Icon = getLeaveTypeIcon(leave.type);
                    return (
                      <tr key={leave._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Icon className="text-primary" />
                            <span className="text-sm font-medium text-gray-900">{getLeaveTypeLabel(leave.type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(leave.startDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(leave.endDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {leave.days} {t('users.days')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                            {t(`leaves.${leave.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {leave.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default UserAnalytics;

