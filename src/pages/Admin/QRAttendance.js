import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaQrcode,
  FaSync,
  FaClock,
  FaCheckCircle,
  FaUsers,
  FaChartLine,
  FaSignOutAlt
} from 'react-icons/fa';
import { showSuccess, showError } from '../../utils/toast';

const QRAttendance = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isRTL = i18n.language === 'ar';
  const isQRManager = user?.role === 'qr-manager';
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [stats, setStats] = useState(null);
  const [qrSize, setQrSize] = useState(280);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Calculate responsive QR code size
  useEffect(() => {
    const calculateQrSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setQrSize(220); // Mobile
      } else if (width < 1024) {
        setQrSize(280); // Tablet
      } else {
        setQrSize(350); // Desktop
      }
    };

    calculateQrSize();
    window.addEventListener('resize', calculateQrSize);
    return () => window.removeEventListener('resize', calculateQrSize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/attendance/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const generateNewQR = useCallback(async (showToast = false) => {
    try {
      const response = await api.post('/attendance/qr/generate');
      setQrData(response.data.data);
      setLoading(false);
      // Only show success toast for manual generation
      if (showToast) {
        showSuccess(t('attendance.qrGenerated'));
      }
      fetchStats();
    } catch (error) {
      console.error('Error generating QR:', error);
      showError(t('attendance.errorGeneratingQR'));
      setLoading(false);
    }
  }, [t, fetchStats]);

  useEffect(() => {
    // Generate initial QR when page opens
    generateNewQR(false);

    // Auto-generate new QR every 30 seconds
    intervalRef.current = setInterval(() => {
      generateNewQR(false);
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [generateNewQR]);

  useEffect(() => {
    if (qrData) {
      // Start countdown from 30 seconds
      setCountdown(30);

      if (countdownRef.current) clearInterval(countdownRef.current);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 30; // Reset countdown
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [qrData]);

  if (loading) return <Loading />;

  // Generate QR URL for scanning
  const qrUrl = qrData ? `${window.location.origin}/attend/${qrData.token}` : '';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaQrcode className="text-primary" />
                {t('attendance.qrAttendanceSystem')}
              </h1>
              <p className="text-gray-600 mt-2">{t('attendance.qrSystemDescription')}</p>
            </div>

            <div className="flex items-center gap-4">
              {stats && (
                <>
                  <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-green-600">{stats.today.checkins}</p>
                    <p className="text-xs text-gray-600">{t('attendance.checkInsToday')}</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{stats.today.uniqueUsers}</p>
                    <p className="text-xs text-gray-600">{t('attendance.activeUsers')}</p>
                  </div>
                </>
              )}

              {/* Logout Button - Show for QR Manager */}
              {isQRManager && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white rounded-lg shadow-sm transition-colors font-medium"
                  title={t('common.logout') || 'Logout'}
                >
                  <FaSignOutAlt />
                  <span className="hidden sm:inline">{t('common.logout') || 'Logout'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main QR Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* QR Code Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8 lg:p-12 text-center">
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                  {t('attendance.scanToRecord')}
                </h2>
                <p className="text-sm md:text-base text-gray-600">{t('attendance.scanDescription')}</p>
              </div>

              {/* QR Code */}
              {qrData && (
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-xl border-2 md:border-4 border-primary mb-4 md:mb-6 transform hover:scale-105 transition-transform duration-300 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                    <div className="w-full flex justify-center">
                      <QRCodeSVG
                        value={qrUrl}
                        size={qrSize}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: '', // Add your logo if you have one
                          height: qrSize < 280 ? 35 : 50,
                          width: qrSize < 280 ? 35 : 50,
                          excavate: true
                        }}
                      />
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <FaClock className="text-2xl md:text-3xl text-primary animate-pulse" />
                    <div className="text-center">
                      <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary tabular-nums">
                        {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                        {String(countdown % 60).padStart(2, '0')}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">{t('attendance.timeRemaining')}</p>
                    </div>
                  </div>

                  {/* QR Info */}
                  <div className="grid grid-cols-2 gap-2 md:gap-4 w-full max-w-md">
                    <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl md:text-2xl font-bold text-gray-800">#{qrData.sequenceNumber}</p>
                      <p className="text-xs text-gray-600">{t('attendance.qrNumber')}</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl md:text-2xl font-bold text-gray-800">{qrData.usageCount || 0}</p>
                      <p className="text-xs text-gray-600">{t('attendance.scansCount')}</p>
                    </div>
                  </div>
                </div>
              )}

              {!qrData && (
                <div className="py-12">
                  <FaQrcode className="text-8xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('attendance.noActiveQR')}</p>
                  <button
                    onClick={() => generateNewQR(true)}
                    className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <FaSync className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('attendance.generateQR')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-primary" />
                {t('attendance.howItWorks')}
              </h3>
              <ol className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</span>
                  <span className="text-sm text-gray-700">{t('attendance.step1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</span>
                  <span className="text-sm text-gray-700">{t('attendance.step2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</span>
                  <span className="text-sm text-gray-700">{t('attendance.step3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">4</span>
                  <span className="text-sm text-gray-700">{t('attendance.step4')}</span>
                </li>
              </ol>
            </div>

            {/* Today's Stats */}
            {stats && (
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-md p-6 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FaChartLine />
                  {t('attendance.todayStats')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>{t('attendance.totalCheckIns')}</span>
                    <span className="text-2xl font-bold">{stats.today.checkins}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('attendance.totalCheckOuts')}</span>
                    <span className="text-2xl font-bold">{stats.today.checkouts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('attendance.uniqueUsers')}</span>
                    <span className="text-2xl font-bold">{stats.today.uniqueUsers}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/30">
                    <span>{t('attendance.totalActions')}</span>
                    <span className="text-2xl font-bold">{stats.today.totalLogs}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Info */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-3">
                🔒 {t('attendance.securityInfo')}
              </h3>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li>• {t('attendance.qrChangesEvery60Seconds')}</li>
                <li>• {t('attendance.oldQRsExpire')}</li>
                <li>• {t('attendance.onlyLast10Saved')}</li>
                <li>• {t('attendance.requiresAuthentication')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QRAttendance;

