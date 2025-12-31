import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Loading from '../../components/Common/Loading';
import { FaCheckCircle, FaSignOutAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { showSuccess, showError } from '../../utils/toast';

const AttendAction = () => {
  const { token } = useParams();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login, then back here
        navigate(`/login?redirect=/attend/${token}`);
      } else {
        validateToken();
      }
    }
  }, [authLoading, user, token]);

  useEffect(() => {
    let interval;
    if (isValid && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsValid(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isValid, countdown]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/attendance/validate/${token}`);
      setIsValid(response.data.data.valid);
      setQrInfo(response.data.data);
      setCountdown(response.data.data.expiresIn);

      // Fetch today's attendance status
      await fetchTodayAttendance();
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValid(false);
    } finally {
      setValidating(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoadingAttendance(true);
      // Get today's date in UTC format (YYYY-MM-DD)
      const today = new Date();
      const year = today.getUTCFullYear();
      const month = String(today.getUTCMonth() + 1).padStart(2, '0');
      const day = String(today.getUTCDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Fetch user's attendance for today
      const response = await api.get('/attendance/my-attendance', {
        params: {
          limit: 1
        }
      });

      // Find today's attendance record
      const todayRecord = response.data.data.find(a => a.date === todayStr);
      setTodayAttendance(todayRecord || null);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance(null);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAction = async (type) => {
    if (!isValid) {
      showError(t('attendance.qrExpired'));
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/attendance/record', {
        token,
        type
      });

      showSuccess(response.data.message);

      // Refresh today's attendance status
      await fetchTodayAttendance();

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error recording attendance:', error);

      // Rate limit errors are already handled by API interceptor
      if (!error.isRateLimit) {
        showError(error.response?.data?.message || t('attendance.errorRecording'));
      }
      setProcessing(false);
    }
  };

  if (authLoading || validating) {
    return <Loading />;
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
          <FaExclamationTriangle className="text-6xl text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {t('attendance.invalidQR')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('attendance.qrExpiredOrInvalid')}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
          >
            {t('attendance.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-8 text-gray-800 text-center">
          <img
            src="/logo.png"
            alt="Atsha"
            className="h-20 w-auto mx-auto mb-4"
          />
          <p className="text-gray-800">{t('attendance.recordYourAttendance')}</p>
        </div>

        {/* User Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.department} • {user?.role}</p>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {/* <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-center gap-3">
            <FaClock className="text-yellow-600 animate-pulse" />
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-800 tabular-nums">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </p>
              <p className="text-xs text-yellow-700">{t('attendance.timeRemaining')}</p>
            </div>
          </div>
        </div> */}

        {/* Actions */}
        <div className="p-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
            {t('attendance.selectAction')}
          </h2>

          {/* Check In Button */}
          <button
            onClick={() => handleAction('checkin')}
            disabled={processing || loadingAttendance}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl py-6 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <FaCheckCircle className="text-2xl" />
              <span>{t('attendance.checkIn')}</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>

          {/* Show check-in status if already checked in */}
          {todayAttendance && todayAttendance.checkin && (
            <div className="w-full bg-green-50 border-2 border-green-200 rounded-xl py-4 px-6 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                <FaCheckCircle className="text-xl" />
                <span className="font-semibold">{t('attendance.alreadyCheckedIn') || 'Already Checked In'}</span>
              </div>
              <p className="text-sm text-green-600">
                {t('attendance.checkInTime') || 'Check In Time'}: {new Date(todayAttendance.checkin.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Check Out Button */}
          <button
            onClick={() => handleAction('checkout')}
            disabled={processing || loadingAttendance}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-6 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <FaSignOutAlt className="text-2xl" />
              <span>{t('attendance.checkOut')}</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>

          {/* Show check-out status if already checked out */}
          {todayAttendance && todayAttendance.checkout && (
            <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl py-4 px-6 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <FaSignOutAlt className="text-xl" />
                <span className="font-semibold">{t('attendance.alreadyCheckedOut') || 'Already Checked Out'}</span>
              </div>
              <p className="text-sm text-blue-600">
                {t('attendance.checkOutTime') || 'Check Out Time'}: {new Date(todayAttendance.checkout.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-8 pb-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700">
              <strong>{t('attendance.note')}:</strong> {t('attendance.actionWillBeRecorded')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            QR #{qrInfo?.sequenceNumber} • {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendAction;

