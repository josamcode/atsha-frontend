import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import { showError, showSuccess } from '../../utils/toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FaArrowLeft,
  FaPrint,
  FaDownload,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUmbrellaBeach,
  FaFileMedical,
  FaBan,
  FaIdCard,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaChartBar,
  FaQrcode,
  FaMobileAlt,
  FaGlobe,
  FaMapMarkerAlt,
  FaFax,
  FaFilePdf
} from 'react-icons/fa';

import CompantStamp from '../../components/Common/CompantStamp';

const EmployeeReportPDF = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user: currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [stats, setStats] = useState({
    attendance: {},
    leaves: {},
    late: {},
    workTime: { totalMinutes: 0, averageMinutes: 0, completeDays: 0 },
    overtime: { totalMinutes: 0, averageMinutes: 0, completeDays: 0 },
    paidDays: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    // Wait for auth to load before checking role
    if (authLoading) {
      // Still loading, don't do anything yet
      return;
    }

    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Allow access if:
    // 1. User is admin (can view any report)
    // 2. User is viewing their own report (id matches currentUser.id)
    const isAdmin = currentUser.role === 'admin';
    const isOwnReport = currentUser._id === id || currentUser.id === id;

    if (!isAdmin && !isOwnReport) {
      navigate('/dashboard');
      return;
    }

    fetchUserData();
  }, [id, selectedMonth, selectedYear, currentUser, authLoading, navigate]);

  // [Include all your existing data fetching and calculation logic here]
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get(`/users/${id}`);
      const userData = userResponse.data.data;
      setUser(userData);

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      const attendanceResponse = await api.get('/attendance/logs', {
        params: {
          userId: id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        }
      });

      const attendanceGroupedResponse = await api.get('/attendance/logs/grouped', {
        params: {
          userId: id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        }
      });

      const leavesResponse = await api.get('/leaves', {
        params: {
          userId: id,
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString()
        }
      });

      setAttendanceData(attendanceGroupedResponse.data.data || []);
      setLeavesData(leavesResponse.data.data || []);
      calculateStats(attendanceGroupedResponse.data.data || [], leavesResponse.data.data || [], startDate, endDate, userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.isRateLimit) {
        console.warn('Rate limit exceeded. Retry after:', error.retryAfter, 'seconds');
      } else {
        showError(error.response?.data?.message || t('users.errorLoadingUser'));
      }
    } finally {
      setLoading(false);
    }
  };

  // [Include all your helper functions: getDayName, timeToMinutes, getDaySchedule, isWorkDay, calculateStats, formatTime, etc.]
  const getDayName = (date) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[date.getDay()];
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getDaySchedule = (dayName) => {
    // Ensure workSchedule is a valid object (not array or corrupted)
    const schedule = user?.workSchedule;
    if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) {
      return { startTime: '09:00', endTime: '17:00' };
    }
    if (!schedule[dayName] || typeof schedule[dayName] !== 'object' || Array.isArray(schedule[dayName])) {
      return { startTime: '09:00', endTime: '17:00' };
    }
    return {
      startTime: schedule[dayName].startTime || '09:00',
      endTime: schedule[dayName].endTime || '17:00'
    };
  };

  const isWorkDay = (dayName, userWorkDays) => {
    if (!userWorkDays || userWorkDays.length === 0) {
      return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayName);
    }
    return userWorkDays.includes(dayName);
  };

  const calculateStats = (attendance, leaves, startDate, endDate, userData = null) => {
    const currentUserData = userData || user;
    const userWorkDays = currentUserData?.workDays || [];
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

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

    const attendanceMap = new Map();
    attendance.forEach(a => {
      if (a.date && a.checkin) {
        attendanceMap.set(a.date, a);
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let workingDays = 0;
    let absentDays = 0;
    let nonWorkDays = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;
    let attendanceDays = 0;
    let totalWorkMinutes = 0;
    let totalOvertimeMinutes = 0;
    let completeDays = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayName = getDayName(date);
      const year = selectedYear;
      const month = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const isFutureDate = date > today;

      if (!isWorkDay(dayName, userWorkDays)) {
        nonWorkDays++;
        continue;
      }

      workingDays++;

      if (leaveDates.has(dateStr)) {
        continue;
      }

      const dayAttendance = attendanceMap.get(dateStr);
      if (dayAttendance && dayAttendance.checkin) {
        attendanceDays++;
        const checkinTime = new Date(dayAttendance.checkin.timestamp);
        const daySchedule = getDaySchedule(dayName);
        const expectedStartMinutes = timeToMinutes(daySchedule.startTime);
        const checkinMinutes = checkinTime.getHours() * 60 + checkinTime.getMinutes();

        if (checkinMinutes > expectedStartMinutes) {
          lateCount++;
          const lateMinutes = checkinMinutes - expectedStartMinutes;
          totalLateMinutes += lateMinutes;
        }

        if (dayAttendance.checkout) {
          completeDays++;
          const checkoutTime = new Date(dayAttendance.checkout.timestamp);
          const checkoutMinutes = checkoutTime.getHours() * 60 + checkoutTime.getMinutes();
          const workMinutes = checkoutMinutes - checkinMinutes;
          totalWorkMinutes += workMinutes;
          const expectedEndMinutes = timeToMinutes(daySchedule.endTime);
          const overtimeMinutes = checkoutMinutes - expectedEndMinutes;
          totalOvertimeMinutes += overtimeMinutes;
        }
      } else {
        if (!isFutureDate) {
          absentDays++;
        }
      }
    }

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
    return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return '-';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper function to convert image to base64 using fetch (better CORS handling)
  const imageToBase64 = async (url) => {
    try {
      // First, try to fetch the image as blob
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // Fallback to Image method if fetch fails
      console.warn('Fetch failed, trying Image method:', error);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          try {
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
    }
  };

  // Helper function to preload all images and convert external images to base64
  const preloadImages = async (element) => {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(async (img) => {
      const imgSrc = img.src;

      // Check if image is from external source (API URL)
      const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000';
      const isExternalImage = imgSrc.includes(apiUrl) || imgSrc.startsWith('http://') || imgSrc.startsWith('https://');

      // If image is from external source, try to convert to base64
      if (isExternalImage && !imgSrc.startsWith('data:')) {
        try {
          const base64 = await imageToBase64(imgSrc);
          img.src = base64;
          return Promise.resolve();
        } catch (error) {
          console.warn('Failed to convert image to base64, using original:', imgSrc, error);
          // Continue with original image
        }
      }

      // Set crossOrigin to anonymous to allow CORS
      if (img.src && !img.crossOrigin) {
        img.crossOrigin = 'anonymous';
      }

      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Image load timeout:', img.src);
          resolve(); // Resolve on timeout to not block the process
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          console.error('Error loading image:', img.src);
          resolve(); // Resolve even on error to not block the process
        };

        // Force reload if image is already in cache but not loaded
        if (img.complete && img.naturalHeight === 0) {
          const src = img.src;
          img.src = '';
          img.src = src;
        }
      });
    });
    return Promise.all(imagePromises);
  };

  const handleSendReport = async () => {
    if (!user) return;

    // Only admins can send reports
    if (currentUser?.role !== 'admin') {
      showError(t('users.unauthorized') || 'You are not authorized to perform this action');
      return;
    }

    setSendingEmail(true);
    try {
      await api.post(`/users/${id}/send-report`, {
        month: selectedMonth,
        year: selectedYear
      });
      showSuccess(t('users.reportSentSuccessfully') || 'Report sent successfully');
    } catch (error) {
      console.error('Error sending report:', error);
      showError(error.response?.data?.message || t('users.errorSendingReport') || 'Error sending report');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    setExporting(true);

    try {
      const element = printRef.current;

      // Preload all images first
      await preloadImages(element);

      // Wait a bit more for any remaining images/fonts to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Hide the action buttons temporarily
      const actionBar = document.querySelector('[data-action-bar]');
      if (actionBar) {
        actionBar.style.display = 'none';
      }

      // Get scroll dimensions
      const scrollWidth = element.scrollWidth;
      const scrollHeight = element.scrollHeight;

      // Create canvas with high quality settings
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true, // Set to true to allow images from different origins
        backgroundColor: '#ffffff',
        logging: false,
        width: scrollWidth,
        height: scrollHeight,
        windowWidth: scrollWidth,
        windowHeight: scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        // Force rendering of all elements and ensure images are loaded
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-print-content]');
          if (clonedElement) {
            clonedElement.style.display = 'block';
            clonedElement.style.opacity = '1';
            clonedElement.style.visibility = 'visible';
          }

          // Ensure all images in the cloned document have crossOrigin set and are visible
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            // Set crossOrigin for CORS
            if (img.src && !img.crossOrigin) {
              img.crossOrigin = 'anonymous';
            }
            // Force image to be visible and loaded
            img.style.display = 'block';
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';

            // If image failed to load, try to reload it
            if (!img.complete || img.naturalHeight === 0) {
              const src = img.src;
              img.src = '';
              setTimeout(() => {
                img.src = src;
              }, 100);
            }
          });
        }
      });

      // Show action bar again
      if (actionBar) {
        actionBar.style.display = 'flex';
      }

      // Get canvas dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Convert pixels to mm (1px = 0.264583mm)
      const pdfWidth = (imgWidth * 0.264583) / 3; // Divide by scale
      const pdfHeight = (imgHeight * 0.264583) / 3;

      // Create PDF with exact dimensions
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Add image to PDF (full page, no margins)
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');

      // Save the PDF
      const fileName = `employee_report_${user?.name?.replace(/\s+/g, '_') || id}_${currentMonth}_${selectedYear}.pdf`;
      pdf.save(fileName);

      showSuccess(t('forms.exportSuccess') || 'PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError(t('forms.errorExporting') || 'Error exporting PDF');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-gray-500">{t('users.userNotFound')}</p>
        </div>
      </div>
    );
  }

  const monthNames = isRTL
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const currentMonth = monthNames[selectedMonth];
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Generate attendance calendar data similar to PDF format
  const generateAttendanceCalendar = () => {
    const calendar = [];
    const attendanceMap = new Map();

    attendanceData.forEach(a => {
      if (a.date && a.checkin) {
        attendanceMap.set(a.date, a);
      }
    });

    // Create a map of leave dates with their types
    const leaveDatesMap = new Map();
    leavesData.forEach(leave => {
      if (leave.status === 'approved') {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          leaveDatesMap.set(dateStr, leave.type);
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = totalDaysInMonth; day >= 1; day--) {
      // Use UTC date to match backend format
      const date = new Date(Date.UTC(selectedYear, selectedMonth, day));
      const localDate = new Date(selectedYear, selectedMonth, day);
      const dayName = getDayName(localDate);
      const year = selectedYear;
      const month = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const isFutureDate = localDate > today;

      let status = ''; // Empty by default
      let statusColor = 'bg-gray-100 text-gray-600';

      // Check if it's a non-work day
      if (!isWorkDay(dayName, user?.workDays)) {
        // Non-work days should be empty (no letter)
        status = '';
        statusColor = 'bg-gray-100 text-gray-600';
      } else if (isFutureDate) {
        // Future dates should be empty (no letter)
        status = '';
        statusColor = 'bg-gray-100 text-gray-600';
      } else if (leaveDatesMap.has(dateStr)) {
        // Check leave type
        const leaveType = leaveDatesMap.get(dateStr);
        switch (leaveType) {
          case 'sick':
            status = 'SL'; // Sick Leave
            statusColor = 'bg-purple-500 text-white';
            break;
          case 'vacation':
            status = 'AN'; // Annual Leave
            statusColor = 'bg-blue-500 text-white';
            break;
          case 'permission':
            status = 'AS'; // Permission (استئذان)
            statusColor = 'bg-yellow-500 text-white';
            break;
          case 'emergency':
          case 'unpaid':
          case 'other':
            status = 'SL'; // Default to SL for other leave types
            statusColor = 'bg-purple-500 text-white';
            break;
          default:
            status = 'SL';
            statusColor = 'bg-purple-500 text-white';
        }
      } else {
        // Check attendance
        const dayAttendance = attendanceMap.get(dateStr);
        if (dayAttendance && dayAttendance.checkin) {
          const checkinTime = new Date(dayAttendance.checkin.timestamp);
          const daySchedule = getDaySchedule(dayName);
          const expectedStartMinutes = timeToMinutes(daySchedule.startTime);
          const checkinMinutes = checkinTime.getHours() * 60 + checkinTime.getMinutes();

          if (checkinMinutes > expectedStartMinutes) {
            status = 'TR'; // Late (متأخر)
            statusColor = 'bg-orange-500 text-white';
          } else {
            status = 'A'; // Present (حاضر)
            statusColor = 'bg-green-500 text-white';
          }
        } else {
          // Absent (غائب)
          status = 'P';
          statusColor = 'bg-primary text-white';
        }
      }

      calendar.push({ day, status, statusColor });
    }

    return calendar;
  };

  const attendanceCalendar = generateAttendanceCalendar();

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '20px' }}>
      {/* Action Bar - Fixed Position */}
      <div
        data-action-bar
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        {/* Month/Year Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {t('users.selectMonth')}:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Send Report Button - Only for admins */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={handleSendReport}
            disabled={sendingEmail || !user?.email}
            style={{
              background: (sendingEmail || !user?.email) ? '#9ca3af' : '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: (sendingEmail || !user?.email) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s',
              opacity: (sendingEmail || !user?.email) ? 0.6 : 1
            }}
            onMouseEnter={(e) => !sendingEmail && user?.email && (e.target.style.background = '#059669')}
            onMouseLeave={(e) => !sendingEmail && user?.email && (e.target.style.background = '#10b981')}
          >
            <FaEnvelope />
            {sendingEmail ? (t('users.sendingReport') || 'Sending...') : (t('users.sendReport') || 'Send Report')}
          </button>
        )}

        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          style={{
            background: exporting ? '#9ca3af' : '#d4b900',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: exporting ? 'wait' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !exporting && (e.target.style.background = '#b91c1c')}
          onMouseLeave={(e) => !exporting && (e.target.style.background = '#d4b900')}
        >
          <FaFilePdf />
          {exporting ? (t('forms.exporting') || 'Exporting...') : t('forms.exportPDF')}
        </button>

        {/* Print Button */}
        {/* <button
          onClick={handlePrint}
          disabled={exporting}
          style={{
            background: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s',
            opacity: exporting ? 0.6 : 1
          }}
          onMouseEnter={(e) => !exporting && (e.target.style.background = '#4b5563')}
          onMouseLeave={(e) => !exporting && (e.target.style.background = '#6b7280')}
        >
          <FaPrint />
          {t('forms.print') || 'Print'}
        </button> */}

        {/* Back Button */}
        <button
          onClick={() => navigate(`/users/${id}/analytics`)}
          disabled={exporting}
          style={{
            background: '#374151',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s',
            opacity: exporting ? 0.6 : 1
          }}
          onMouseEnter={(e) => !exporting && (e.target.style.background = '#1f2937')}
          onMouseLeave={(e) => !exporting && (e.target.style.background = '#374151')}
        >
          <FaArrowLeft />
          {t('common.back')}
        </button>
      </div>

      {/* Report Content - Styled like PDF */}
      <div
        ref={printRef}
        data-print-content
        style={{
          width: '100%',
          margin: '0 auto',
          background: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minHeight: 'calc(100vh - 40px)',
          position: 'relative',
          maxWidth: '1200px'
        }}
        className="print:shadow-none relative print-content"
      >
        {/* Watermark - Logo behind content */}
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.05 }}>
          <img
            src="/logo.png"
            alt="Watermark"
            className="w-full max-w-3xl h-auto transform rotate-[15deg]"
            style={{ maxHeight: '90%', objectFit: 'contain' }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Header with dashed border (PDF style) */}
        <div className="relative z-10">
          {/* Dashed border decoration */}
          <div className="absolute inset-0 border-4 border-dashed border-gray-400 rounded-lg m-4"></div>

          <div className="p-12 relative z-10">
            {/* Company Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center justify-between mb-4">
                {/* Company Logo Placeholder */}
                <img
                  src="/logo.png"
                  alt="Company Logo"
                  className="w-36 h-16"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Report Title with decorative elements */}
              <div className="relative">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-1 w-12 bg-primary mr-4"></div>
                  <h2 className="text-3xl font-bold text-primary px-4">
                    {t('users.monthlyEmployeePerformanceReport')}
                  </h2>
                  <div className="h-1 w-12 bg-primary ml-4"></div>
                </div>
              </div>
            </div>

            {/* Employee Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

              {/* Employee Details Table */}
              <div className="lg:col-span-2">
                <div className="bg-white border-2 border-primary rounded-lg overflow-hidden">
                  <div className="bg-primary text-white text-center py-3">
                    <h4 className="font-bold text-lg">
                      {t('users.employeeInformation')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-300">
                    <div className="grid grid-rows-4 divide-y divide-gray-300">
                      <div className="bg-primary p-3 text-center font-semibold text-white">
                        {t('users.employeeName')}
                      </div>
                      <div className="bg-primary p-3 text-center font-semibold text-white">
                        {t('users.idNumber')}
                      </div>
                      <div className="bg-primary p-3 text-center font-semibold text-white">
                        {t('users.nationality')}
                      </div>
                      <div className="bg-primary p-3 text-center font-semibold text-white">
                        {t('users.position')}
                      </div>
                    </div>
                    <div className="grid grid-rows-4 divide-y divide-gray-300">
                      <div className="p-3 text-center">{user.name}</div>
                      <div className="p-3 text-center">{user.idNumber || '2493357392'}</div>
                      <div className="p-3 text-center">{user.nationality === 'Egyptian' ? 'مصري' : user.nationality === 'Saudi' ? 'سعودي' : user.nationality}</div>
                      <div className="p-3 text-center">{user.jobTitle || user.position || 'موظف'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Photo and Name */}
              <div className="lg:col-span-1 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                    {user.image ? (
                      <img
                        src={`${((process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000'}${user.image}`}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h3>
                <p className="text-lg text-primary font-semibold">
                  {t(`departments.${user.department}`)}
                </p>
              </div>
            </div>

            {/* Attendance Calendar Section */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-center text-primary mb-6">
                {t('users.employeeAttendanceFor')} {currentMonth} {selectedYear}
              </h3>

              {/* Attendance Legend */}
              <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 text-white flex items-center justify-center font-bold text-xs">A</div>
                  <span>{t('users.present')}</span>

                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary text-white flex items-center justify-center font-bold text-xs">P</div>
                  <span>{t('users.absent')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-500 text-white flex items-center justify-center font-bold text-xs">SL</div>
                  <span>{t('users.sickLeave')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center font-bold text-xs">AN</div>
                  <span>{t('users.annualLeave')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-500 text-white flex items-center justify-center font-bold text-xs">AS</div>
                  <span>{t('users.permissions')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 text-white flex items-center justify-center font-bold text-xs">TR</div>
                  <span>{t('users.late')}</span>
                </div>
              </div>

              {/* Calendar Grid - Professional Design */}
              <div className="border-2 border-gray-300 rounded-lg overflow-x-auto max-w-full">
                <div className="inline-block min-w-full">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-31 bg-gray-100 text-center text-xs font-semibold border-b-2 border-gray-400">
                    {Array.from({ length: 31 }, (_, i) => (
                      <div key={i} className="p-1 border-r border-gray-300 last:border-r-0">
                        <span className="inline-block min-w-[20px]">{31 - i}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Data */}
                  <div className="grid grid-cols-31 bg-white text-center">
                    {Array.from({ length: 31 }, (_, i) => {
                      const dayNumber = 31 - i;
                      const dayData = attendanceCalendar.find(d => d.day === dayNumber);
                      return (
                        <div key={i} className="p-1 border-r border-gray-300 border-b last:border-r-0 flex items-center justify-center min-h-[32px]">
                          {dayData && dayNumber <= totalDaysInMonth && dayData.status ? (
                            <div className={`w-6 h-6 flex items-center justify-center text-[9px] font-bold rounded ${dayData.statusColor} flex-shrink-0`}>
                              {dayData.status}
                            </div>
                          ) : (
                            <div className="w-6 h-6"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Summary Table */}
            <div className="mb-8">
              <div className="border-2 border-primary rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 bg-primary text-center text-sm font-semibold text-white divide-x divide-primary-dark">
                  <div className="p-3">{t('users.totalAttendance')}</div>
                  <div className="p-3">{t('users.totalAbsent')}</div>
                  <div className="p-3">{t('users.weekendDays')}</div>
                  <div className="p-3">{t('users.sickLeave')}</div>
                  <div className="p-3">{t('users.annualLeave')}</div>
                  <div className="p-3">{t('users.permissions')}</div>
                  <div className="p-3">{t('users.lateMinutes')}</div>
                  <div className="p-3">{t('users.totalWorkDays')}</div>
                </div>
                <div className="grid grid-cols-8 bg-white text-center divide-x divide-gray-300">
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.attendance.total} {t('users.days')}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.attendance.absent} {t('users.days')}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.attendance.nonWorkDays} {t('users.days')}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.leaves.byCategory?.sick?.days || 0} {t('users.days')}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.leaves.byCategory?.vacation?.days || 0} {t('users.days')}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.leaves.byCategory?.permission?.days || 0}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.late.totalMinutes} {t('users.minutes')}
                  </div>
                  <div className="p-4 text-lg font-bold text-gray-800">
                    {stats.paidDays} {t('users.days')}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with company stamp and QR code */}
            <div className="mt-24 mb-16">
              {/* Company Stamp - Left Side */}
              <CompantStamp color="blue" />

              {/* Contact Info and QR - Bottom Center */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  {/* Large QR Code - Positioned above container */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-20 h-20 bg-white rounded-lg shadow-lg border-2 border-gray-300 flex items-center justify-center">
                      <FaQrcode className="text-primary text-4xl" />
                    </div>
                  </div>

                  {/* Contact Container */}
                  <div className="bg-primary text-white px-8 py-3 rounded-t-lg shadow-lg pt-2">
                    <div className="flex items-center justify-center gap-28 flex-row-reverse">
                      {/* Phone Number */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-3xl">{t('users.companyPhone')}</span>
                        <FaPhone className="text-white w-6 h-6 text-lg border-2 border-white rounded-full p-1" />
                      </div>

                      {/* Company Name and Icons */}
                      <div className="text-center">
                        <div className="font-bold text-xl mb-1">{t('users.atsha')}</div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <FaEnvelope className="text-white w-6 h-6 text-sm border-2 border-white rounded-full p-1" />
                          <FaMobileAlt className="text-white w-6 h-6 text-sm border-2 border-white rounded-full p-1" />
                          <FaGlobe className="text-white w-6 h-6 text-sm border-2 border-white rounded-full p-1" />
                          <FaMapMarkerAlt className="text-white w-6 h-6 text-sm border-2 border-white rounded-full p-1" />
                          <FaPhone className="text-white w-6 h-6 text-sm border-2 border-white rounded-full p-1" />
                          <FaFax className="text-white w-6 h-6 text-sm border-2 border-white rounded-full p-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer to ensure proper spacing */}
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Hide Layout, Navbar, Sidebar and all navigation */
          nav,
          aside,
          header,
          .no-print,
          [class*="Navbar"],
          [class*="Sidebar"],
          [class*="MobileBottomNav"],
          [class*="Layout"] > nav,
          [class*="Layout"] > aside,
          [class*="Layout"] > header {
            display: none !important;
          }
          
          /* Reset body */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12pt;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
          }
          
          /* Hide Layout wrapper's flex/grid containers but show content */
          [class*="Layout"] {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Show only the report content */
          .min-h-screen.bg-white {
            margin: 0 !important;
            padding: 0 !important;
            min-height: auto !important;
            background: white !important;
            display: block !important;
          }
          
          .max-w-6xl.print-content {
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0.15in !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            page-break-inside: avoid !important;
            position: relative !important;
            box-sizing: border-box !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .grid-cols-31 {
            grid-template-columns: repeat(31, minmax(20px, 1fr)) !important;
          }
          
          @page {
            size: A4 landscape;
            margin: 0.2in;
          }
          
          /* Scale down the entire report to fit on one page */
          .print-content {
            transform: scale(0.65) !important;
            transform-origin: top left !important;
            width: 153.85% !important;
            height: 153.85% !important;
          }
          
          /* Reduce font sizes globally */
          .print-content {
            font-size: 10pt !important;
          }
          
          .print-content * {
            font-size: inherit !important;
          }
          
          .print-content h1 {
            font-size: 1.4em !important;
          }
          
          .print-content h2 {
            font-size: 1.2em !important;
          }
          
          .print-content h3 {
            font-size: 1.1em !important;
          }
          
          /* Reduce padding and margins significantly */
          .print-content .p-12 {
            padding: 0.75em !important;
          }
          
          .print-content .p-8 {
            padding: 0.5em !important;
          }
          
          .print-content .p-4 {
            padding: 0.3em !important;
          }
          
          .print-content .p-3 {
            padding: 0.25em !important;
          }
          
          .print-content .mb-8 {
            margin-bottom: 0.5em !important;
          }
          
          .print-content .mb-6 {
            margin-bottom: 0.4em !important;
          }
          
          .print-content .mb-4 {
            margin-bottom: 0.3em !important;
          }
          
          .print-content .mb-2 {
            margin-bottom: 0.2em !important;
          }
          
          .print-content .mt-8 {
            margin-top: 0.5em !important;
          }
          
          .print-content .mt-6 {
            margin-top: 0.4em !important;
          }
          
          .print-content .mt-4 {
            margin-top: 0.3em !important;
          }
          
          /* Reduce table cell padding */
          .print-content td,
          .print-content th {
            padding: 0.2em 0.3em !important;
            font-size: 0.75em !important;
          }
          
          /* Reduce image sizes */
          .print-content img {
            max-width: 60px !important;
            max-height: 45px !important;
          }
          
          .print-content .w-36 {
            width: 4rem !important;
          }
          
          .print-content .h-16 {
            height: 3rem !important;
          }
          
          /* Reduce calendar grid size */
          .print-content .grid-cols-31 > div {
            padding: 0.15em !important;
            min-height: 20px !important;
            font-size: 0.7em !important;
          }
          
          /* Reduce spacing in grid */
          .print-content .gap-4 {
            gap: 0.3em !important;
          }
          
          .print-content .gap-2 {
            gap: 0.2em !important;
          }
          
          /* Reduce border widths */
          .print-content .border-4 {
            border-width: 2px !important;
          }
          
          .print-content .border-2 {
            border-width: 1px !important;
          }
          
          /* Reduce rounded corners */
          .print-content .rounded-lg {
            border-radius: 0.25rem !important;
          }
          
          /* Reduce footer height */
          .print-content .h-24 {
            height: 1.5rem !important;
          }
          
          .print-content .h-20 {
            height: 1.2rem !important;
          }
          
          /* Ensure watermark appears in print */
          .watermark {
            opacity: 0.5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Prevent page breaks inside important sections */
          .border-2.border-gray-300,
          table,
          .grid {
            page-break-inside: avoid !important;
          }
          
          /* Force single page */
          .print-content {
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
        }
        
        .grid-cols-31 {
          display: grid;
          grid-template-columns: repeat(31, minmax(0, 1fr));
          width: 100%;
        }
        
        @media (max-width: 1200px) {
          .grid-cols-31 {
            grid-template-columns: repeat(31, minmax(22px, 1fr));
          }
        }
        
        @media print {
          .grid-cols-31 {
            grid-template-columns: repeat(31, minmax(18px, 1fr));
          }
        }
        `}}></style>
    </div>
  );
};

export default EmployeeReportPDF;