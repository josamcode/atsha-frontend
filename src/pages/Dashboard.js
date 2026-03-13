import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDate, formatTime } from '../utils/dateUtils';
import { isPlatformAdmin } from '../utils/organization';
import Layout from '../components/Layout/Layout';
import DataTable from '../components/Common/DataTable';
import Loading from '../components/Common/Loading';
import PlatformDashboard from '../components/Platform/PlatformDashboard';
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
  const platformAdminView = isPlatformAdmin(user);

  useEffect(() => {
    if (!platformAdminView) {
      fetchDashboardData();
    }
  }, [platformAdminView]);

  if (platformAdminView) {
    return <PlatformDashboard />;
  }

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

  const StatCard = ({ title, value, icon: Icon, color, link, subtitle }) => {
    const content = (
      <div className="flex items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle ? (
            <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm ${color}`}>
          <Icon className="text-xl" />
        </div>
      </div>
    );

    if (!link) {
      return <div className="group">{content}</div>;
    }

    return (
      <Link to={link} className="group block">
        {content}
      </Link>
    );
  };

  const recentFormsColumns = [
    {
      key: 'templateDetails',
      header: t('forms.templateDetails'),
      render: (form) => (
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
      )
    },
    {
      key: 'filledBy',
      header: t('forms.filledBy'),
      render: (form) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold">
            {form.filledBy?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm text-gray-900">{form.filledBy?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'department',
      header: t('forms.department'),
      render: (form) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {form.filledBy?.department ? t(`departments.${form.filledBy.department}`) : t('common.na')}
        </span>
      )
    },
    {
      key: 'status',
      header: t('forms.status'),
      render: (form) => (
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
      )
    },
    {
      key: 'date',
      header: t('forms.date'),
      render: (form) => (
        <span className="text-sm text-gray-600">
          {formatDate(form.createdAt, i18n.language)}
        </span>
      )
    }
  ];

  const quickActions = [
    user?.role !== 'employee' ? {
      to: '/forms/new',
      title: t('forms.createForm'),
      description: t('dashboard.createNewForm'),
      icon: FaEdit,
      accentClass: 'bg-primary'
    } : null,
    user?.role !== 'admin' ? {
      to: '/attendance',
      title: t('attendance.checkIn'),
      description: t('dashboard.markAttendance'),
      icon: FaClipboardCheck,
      accentClass: 'bg-green-500'
    } : null,
    {
      to: '/leaves/new',
      title: t('leaves.requestLeave'),
      description: t('dashboard.requestTimeOff'),
      icon: FaPlane,
      accentClass: 'bg-violet-600'
    }
  ].filter(Boolean);

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
              subtitle={isRTL ? '\u0627\u0644\u0631\u0635\u064a\u062f \u0627\u0644\u0645\u062a\u0627\u062d' : 'Available days'}
            />
            <StatCard
              title={t('dashboard.myPendingLeaves')}
              value={stats?.leaves?.pending || 0}
              icon={FaHourglassHalf}
              color="bg-amber-500"
              link="/leaves?status=pending"
              subtitle={isRTL ? '\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629' : 'Awaiting review'}
            />
            <StatCard
              title={t('dashboard.myUpcomingLeaves')}
              value={stats?.leaves?.upcoming || 0}
              icon={FaCalendarAlt}
              color="bg-purple-500"
              link="/leaves?status=approved"
              subtitle={isRTL ? '\u0645\u0639\u062a\u0645\u062f\u0629 \u0648\u0645\u062c\u062f\u0648\u0644\u0629' : 'Approved and scheduled'}
            />
            <StatCard
              title={t('dashboard.attendanceThisMonth')}
              value={stats?.attendance?.thisMonth || 0}
              icon={FaCheckCircle}
              color="bg-green-500"
              link="/attendance"
              subtitle={isRTL ? '\u062d\u0636\u0648\u0631 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631' : 'This month'}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('dashboard.formsToday')}
              value={stats?.forms?.today || 0}
              icon={FaFileAlt}
              color="bg-blue-500"
              link={(() => {
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                return `/forms?dateFrom=${startOfDay.toISOString()}&dateTo=${endOfDay.toISOString()}`;
              })()}
              subtitle={`${t('dashboard.formsThisWeek')}: ${stats?.forms?.thisWeek || 0}`}
            />
            <StatCard
              title={t('dashboard.pendingApprovals')}
              value={stats?.forms?.pendingApprovals || 0}
              icon={FaHourglassHalf}
              color="bg-amber-500"
              link="/forms?status=submitted"
              subtitle={isRTL ? '\u0646\u0645\u0627\u0630\u062c \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0642\u0631\u0627\u0631' : 'Forms waiting for review'}
            />
            <StatCard
              title={t('dashboard.attendance')}
              value={stats?.attendance?.today || 0}
              icon={FaCheckCircle}
              color="bg-green-500"
              link={(() => {
                const today = new Date();
                return `/attendance?month=${today.getMonth()}&year=${today.getFullYear()}&day=${today.getDate()}`;
              })()}
              subtitle={isRTL ? '\u0627\u0644\u062d\u0636\u0648\u0631 \u0627\u0644\u0645\u0633\u062c\u0644 \u0627\u0644\u064a\u0648\u0645' : 'Checked in today'}
            />
            <StatCard
              title={t('dashboard.pendingLeaves')}
              value={stats?.leaves?.pending || 0}
              icon={FaUmbrellaBeach}
              color="bg-purple-500"
              link="/leaves?status=pending"
              subtitle={isRTL ? '\u0637\u0644\u0628\u0627\u062a \u0625\u062c\u0627\u0632\u0627\u062a' : 'Time-off requests'}
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
              subtitle={isRTL ? '\u0622\u062e\u0631 7 \u0623\u064a\u0627\u0645' : 'Last 7 days'}
            />
            <StatCard
              title={t('dashboard.upcomingLeaves')}
              value={stats?.leaves?.upcoming || 0}
              icon={FaCalendarAlt}
              color="bg-pink-500"
              subtitle={isRTL ? '\u0625\u062c\u0627\u0632\u0627\u062a \u0642\u0627\u062f\u0645\u0629' : 'Approved soon'}
            />
            <StatCard
              title={t('dashboard.totalUsers')}
              value={stats?.users?.total || 0}
              icon={FaUsers}
              color="bg-teal-500"
              link="/users"
              subtitle={isRTL ? '\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0641\u0631\u064a\u0642' : 'Team members'}
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
              <DataTable
                columns={recentFormsColumns}
                data={stats.recentForms}
                rowKey="_id"
                isRTL={isRTL}
                bodyClassName="bg-white divide-y divide-gray-100"
              />
            )}

            {/* Cards View */}
            {recentFormsView === 'cards' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recentForms.map((form) => (
                    <Link
                      key={form._id}
                      to={`/forms/view/${form._id}`}
                      className="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
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
                            {form.filledBy?.name?.charAt(0)?.toUpperCase()}
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
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FaTasks className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('dashboard.quickActions')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isRTL
                    ? '\u0627\u0646\u062a\u0642\u0644 \u0628\u064a\u0646 \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u064a\u0648\u0645\u064a\u0629 \u0628\u0633\u0631\u0639\u0629'
                    : 'Move through your everyday tasks from here.'}
                </p>
              </div>
            </div>
          </div>
          <div className={`mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 ${quickActions.length > 2 ? 'xl:grid-cols-3' : ''}`}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-200 px-4 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white ${action.accentClass}`}>
                    <Icon className="text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
