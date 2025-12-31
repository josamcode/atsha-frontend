import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDate, formatTime, SAUDI_TIMEZONE } from '../utils/dateUtils';
import Layout from '../components/Layout/Layout';
import Card from '../components/Common/Card';
import Loading from '../components/Common/Loading';
import {
  FaFileAlt,
  FaHourglassHalf,
  FaCheckCircle,
  FaUmbrellaBeach,
  FaChartBar,
  FaCalendarAlt,
  FaUsers,
  FaEdit,
  FaClipboardCheck,
  FaPlane,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaUserCheck,
  FaClipboardList,
  FaTasks,
  FaTh,
  FaList
} from 'react-icons/fa';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentFormsView, setRecentFormsView] = useState('table'); // 'table' or 'cards'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/summary');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link to={link || '#'} className="block group">
      <div className="relative overflow-hidden rounded-xl p-6 bg-white shadow hover:shadow-lg transition-all duration-300 border border-gray-100">
        {/* Content */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="text-2xl text-white" />
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-dark p-8">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FaUserCheck className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {t('dashboard.welcome')}, {user?.name}!
                  </h1>
                  <p className="text-white/90 text-sm mt-1">
                    {t('dashboard.roleAndDepartment', {
                      role: t(`users.${user?.role}`),
                      department: t(`departments.${user?.department}`)
                    })}
                  </p>
                </div>
              </div>

              {/* Date and Time (Saudi Arabia Timezone) */}
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-white/90">
                  <FaCalendarAlt className="text-sm flex-shrink-0" />
                  <span className="text-sm">
                    {formatDate(new Date(), i18n.language)}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-2 text-white/90">
                  <FaClock className="text-sm flex-shrink-0" />
                  <span className="text-sm">
                    {formatTime(new Date(), i18n.language)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          {user?.role === 'employee' ? (
            <div className="grid grid-cols-2 divide-x divide-gray-200 bg-gray-50">
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.leaves?.balance || 0}</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.leaveBalance')}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.attendance?.thisMonth || 0}</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.attendanceThisMonth')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50">
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.forms?.today || 0}</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.formsToday')}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.attendance?.today || 0}</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.present')}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.forms?.pendingApprovals || 0}</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.pending')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {user?.role === 'employee' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('dashboard.leaveBalance')}
              value={stats?.leaves?.balance || 0}
              icon={FaUmbrellaBeach}
              color="bg-blue-500"
              link="/leaves"
            />
            <StatCard
              title={t('dashboard.myPendingLeaves')}
              value={stats?.leaves?.pending || 0}
              icon={FaHourglassHalf}
              color="bg-amber-500"
              link="/leaves?status=pending"
            />
            <StatCard
              title={t('dashboard.myUpcomingLeaves')}
              value={stats?.leaves?.upcoming || 0}
              icon={FaCalendarAlt}
              color="bg-purple-500"
              link="/leaves?status=approved"
            />
            <StatCard
              title={t('dashboard.attendanceThisMonth')}
              value={stats?.attendance?.thisMonth || 0}
              icon={FaCheckCircle}
              color="bg-green-500"
              link="/attendance"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('dashboard.formsToday')}
              value={stats?.forms?.today || 0}
              icon={FaFileAlt}
              color="bg-blue-500"
              link="/forms"
            />
            <StatCard
              title={t('dashboard.pendingApprovals')}
              value={stats?.forms?.pendingApprovals || 0}
              icon={FaHourglassHalf}
              color="bg-amber-500"
              link="/forms?status=submitted"
            />
            <StatCard
              title={t('dashboard.attendance')}
              value={stats?.attendance?.today || 0}
              icon={FaCheckCircle}
              color="bg-green-500"
              link="/attendance"
            />
            <StatCard
              title={t('dashboard.pendingLeaves')}
              value={stats?.leaves?.pending || 0}
              icon={FaUmbrellaBeach}
              color="bg-purple-500"
              link="/leaves?status=pending"
            />
          </div>
        )}

        {/* Additional Stats for Admin/Supervisor */}
        {(user?.role === 'admin' || user?.role === 'supervisor') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title={t('dashboard.formsThisWeek')}
              value={stats?.forms?.thisWeek || 0}
              icon={FaChartBar}
              color="bg-indigo-500"
            />
            <StatCard
              title={t('dashboard.upcomingLeaves')}
              value={stats?.leaves?.upcoming || 0}
              icon={FaCalendarAlt}
              color="bg-pink-500"
            />
            <StatCard
              title={t('dashboard.totalUsers')}
              value={stats?.users?.total || 0}
              icon={FaUsers}
              color="bg-teal-500"
              link="/users"
            />
          </div>
        )}

        {/* Recent Forms */}
        {user?.role !== 'employee' && stats?.recentForms && stats.recentForms.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-primary flex items-center justify-center">
                    <FaClipboardList className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{t('dashboard.recentForms')}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setRecentFormsView('table')}
                      className={`p-2 rounded transition-all ${recentFormsView === 'table'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                      title="Table View"
                    >
                      <FaList className="text-sm" />
                    </button>
                    <button
                      onClick={() => setRecentFormsView('cards')}
                      className={`p-2 rounded transition-all ${recentFormsView === 'cards'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                      title="Cards View"
                    >
                      <FaTh className="text-sm" />
                    </button>
                  </div>
                  <Link to="/forms" className="text-sm text-primary hover:text-primary-dark font-semibold hover:underline">
                    {t('dashboard.viewAll')} →
                  </Link>
                </div>
              </div>
            </div>

            {/* Table View */}
            {recentFormsView === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`bg-gray-50 ${t('language') === 'ar' ? 'text-right' : 'text-left'}`}>
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('forms.templateDetails')}
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('forms.filledBy')}
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('forms.department')}
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('forms.status')}
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('forms.date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {stats.recentForms.map((form) => (
                      <tr key={form._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            to={`/forms/view/${form._id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FaFileAlt className="text-blue-600 text-sm" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                                {isRTL ? (form.templateId?.title?.ar || 'N/A') : (form.templateId?.title?.en || 'N/A')}
                              </p>
                              <p className="text-xs text-gray-500">#{form._id.slice(-6)}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold">
                              {form.filledBy?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900">{form.filledBy?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {form.filledBy?.department ? t(`departments.${form.filledBy.department}`) : t('common.na')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${form.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : form.status === 'submitted'
                                ? 'bg-amber-100 text-amber-800'
                                : form.status === 'rejected'
                                  ? 'bg-primary text-primary-darko'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {t(`forms.${form.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(form.createdAt, i18n.language)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards View */}
            {recentFormsView === 'cards' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recentForms.map((form) => (
                    <Link
                      key={form._id}
                      to={`/forms/view/${form._id}`}
                      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FaFileAlt className="text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {isRTL ? (form.templateId?.title?.ar || 'N/A') : (form.templateId?.title?.en || 'N/A')}
                          </h4>
                          <p className="text-xs text-gray-500">#{form._id.slice(-6)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {form.filledBy?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-600 truncate">{form.filledBy?.name || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{form.filledBy?.department ? t(`departments.${form.filledBy.department}`) : t('common.na')}</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${form.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : form.status === 'submitted'
                                ? 'bg-amber-100 text-amber-800'
                                : form.status === 'rejected'
                                  ? 'bg-primary text-primary-darko'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {t(`forms.${form.status}`)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <FaClock className="flex-shrink-0" />
                          <span>{formatDate(form.createdAt, i18n.language)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <FaTasks className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('dashboard.quickActions')}</h3>
            </div>
          </div>
          <div className="p-6">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${user?.role === 'employee' ? 'md:grid-cols-2' : ''}`}>
              {user?.role !== 'employee' && (
                <Link
                  to="/forms/new"
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FaEdit className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('forms.createForm')}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.createNewForm')}</p>
                  </div>
                </Link>
              )}

              {user?.role !== 'admin' && (
                <Link
                  to="/attendance"
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FaClipboardCheck className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('attendance.checkIn')}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.markAttendance')}</p>
                  </div>
                </Link>
              )}

              <Link
                to="/leaves/new"
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FaPlane className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('leaves.requestLeave')}</p>
                  <p className="text-xs text-gray-500">{t('dashboard.requestTimeOff')}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

