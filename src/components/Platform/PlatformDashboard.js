import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBuilding,
  FaCalendarAlt,
  FaClipboardList,
  FaClock,
  FaComments,
  FaEnvelope,
  FaFileAlt,
  FaLayerGroup,
  FaUsers
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Layout from '../Layout/Layout';
import Loading from '../Common/Loading';
import api from '../../utils/api';
import { formatDate, formatTime } from '../../utils/dateUtils';

const PlatformDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setStats(response.data?.data || null);
      } catch (error) {
        console.error('Error fetching platform dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loading />;
  }

  const copy = {
    subtitle: isRTL
      ? '\u0625\u062f\u0627\u0631\u0629 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a \u0648\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u0646 \u0644\u0648\u062d\u0629 \u0648\u0627\u062d\u062f\u0629'
      : 'Manage every organization and system metric from one dashboard',
    quickActionsTitle: isRTL ? '\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0633\u0631\u064a\u0639\u0629' : 'Quick Actions',
    quickActionsDescription: isRTL
      ? '\u0627\u0646\u062a\u0642\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0623\u0647\u0645 \u0634\u0627\u0634\u0627\u062a \u0627\u0644\u0625\u062f\u0627\u0631\u0629'
      : 'Jump straight into the areas you manage most.',
    recentFormsTitle: isRTL
      ? '\u0623\u062d\u062f\u062b \u0627\u0644\u0646\u0645\u0627\u0630\u062c \u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0638\u0627\u0645'
      : 'Recent System Forms',
    recentFormsDescription: isRTL
      ? '\u0622\u062e\u0631 \u0627\u0644\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0645\u0631\u0633\u0644\u0629 \u0645\u0646 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a'
      : 'Latest submitted activity from every organization.',
    noRecentForms: isRTL
      ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0645\u0627\u0630\u062c \u062d\u062f\u064a\u062b\u0629 \u0628\u0639\u062f'
      : 'No recent forms yet.',
    viewAll: isRTL ? '\u0639\u0631\u0636 \u0627\u0644\u0643\u0644' : 'View all'
  };

  const summaryItems = [
    {
      label: isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a' : 'Total Organizations',
      value: stats?.organizations?.total || 0
    },
    {
      label: isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646' : 'Total Users',
      value: stats?.users?.total || 0
    },
    {
      label: isRTL ? '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629' : 'Pending Approvals',
      value: stats?.forms?.pendingApprovals || 0
    }
  ];

  const quickActions = [
    {
      to: '/users',
      title: isRTL ? '\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a' : 'Organizations',
      description: isRTL
        ? '\u0627\u0639\u0631\u0636 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a \u0648\u0623\u0639\u0636\u0627\u0621\u0647\u0627'
        : 'Browse organizations and their members',
      icon: FaBuilding
    },
    {
      to: '/forms',
      title: isRTL ? '\u0627\u0644\u0646\u0645\u0627\u0630\u062c' : 'Forms',
      description: isRTL
        ? '\u0631\u0627\u062c\u0639 \u062c\u0645\u064a\u0639 \u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0646\u0638\u0627\u0645'
        : 'Review every form in the system',
      icon: FaFileAlt
    },
    {
      to: '/templates',
      title: isRTL ? '\u0627\u0644\u0642\u0648\u0627\u0644\u0628' : 'Templates',
      description: isRTL
        ? '\u0627\u0639\u0631\u0636 \u062c\u0645\u064a\u0639 \u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0646\u0638\u0627\u0645'
        : 'Inspect every template across the platform',
      icon: FaLayerGroup
    },
    {
      to: '/messages',
      title: isRTL ? '\u0627\u0644\u0631\u0633\u0627\u0626\u0644' : 'Messages',
      description: isRTL
        ? '\u062a\u0627\u0628\u0639 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0627\u0644\u0643\u0627\u0645\u0644'
        : 'Monitor platform-wide messaging activity',
      icon: FaComments
    },
    {
      to: '/organization',
      title: isRTL ? '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a' : 'Settings',
      description: isRTL
        ? '\u0623\u062f\u0631 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a \u0648\u0627\u0644\u062e\u0637\u0637 \u0645\u0646 \u0645\u0643\u0627\u0646 \u0648\u0627\u062d\u062f'
        : 'Manage organizations and plans from one place',
      icon: FaClipboardList
    }
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, link, accentClass }) => (
    <Link
      to={link}
      className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle ? (
            <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm ${accentClass}`}>
          <Icon className="text-xl" />
        </div>
      </div>
    </Link>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary-dark p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <FaBuilding className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {t('dashboard.welcome')}, {user?.name}!
                  </h1>
                  <p className="mt-1 text-sm text-white/90">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/90">
                  <FaCalendarAlt className="flex-shrink-0 text-sm" />
                  <span className="text-sm">
                    {formatDate(new Date(), i18n.language)}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="flex items-center gap-2 text-white/90">
                  <FaClock className="flex-shrink-0 text-sm" />
                  <span className="text-sm">
                    {formatTime(new Date(), i18n.language)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {summaryItems.map((item) => (
              <div key={item.label} className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="mt-1 text-xs text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title={isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a' : 'Total Organizations'}
            value={stats?.organizations?.total || 0}
            subtitle={isRTL ? `\u0646\u0634\u0637: ${stats?.organizations?.active || 0}` : `Active: ${stats?.organizations?.active || 0}`}
            icon={FaBuilding}
            accentClass="bg-slate-900"
            link="/users"
          />
          <StatCard
            title={isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646' : 'Total Users'}
            value={stats?.users?.total || 0}
            subtitle={isRTL ? `\u0646\u0634\u0637: ${stats?.users?.active || 0}` : `Active: ${stats?.users?.active || 0}`}
            icon={FaUsers}
            accentClass="bg-emerald-600"
            link="/users"
          />
          <StatCard
            title={isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0646\u0645\u0627\u0630\u062c' : 'Total Forms'}
            value={stats?.forms?.total || 0}
            subtitle={isRTL ? `\u0627\u0644\u064a\u0648\u0645: ${stats?.forms?.today || 0}` : `Today: ${stats?.forms?.today || 0}`}
            icon={FaFileAlt}
            accentClass="bg-blue-600"
            link="/forms"
          />
          <StatCard
            title={isRTL ? '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629' : 'Pending Approvals'}
            value={stats?.forms?.pendingApprovals || 0}
            subtitle={isRTL ? '\u0646\u0645\u0627\u0630\u062c \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0642\u0631\u0627\u0631' : 'Forms waiting for review'}
            icon={FaClipboardList}
            accentClass="bg-amber-500"
            link="/forms?status=submitted"
          />
          <StatCard
            title={isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0642\u0648\u0627\u0644\u0628' : 'Total Templates'}
            value={stats?.templates?.total || 0}
            subtitle={isRTL ? `\u0646\u0634\u0637: ${stats?.templates?.active || 0}` : `Active: ${stats?.templates?.active || 0}`}
            icon={FaLayerGroup}
            accentClass="bg-violet-600"
            link="/templates"
          />
          <StatCard
            title={isRTL ? '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0631\u0633\u0627\u0626\u0644' : 'Total Messages'}
            value={stats?.messages?.total || 0}
            subtitle={isRTL ? `\u0627\u0644\u064a\u0648\u0645: ${stats?.messages?.today || 0}` : `Today: ${stats?.messages?.today || 0}`}
            icon={FaEnvelope}
            accentClass="bg-rose-600"
            link="/messages"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {copy.recentFormsTitle}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {copy.recentFormsDescription}
                </p>
              </div>
              <Link to="/forms" className="text-sm font-semibold text-primary hover:underline">
                {copy.viewAll}
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {(stats?.recentForms || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  {copy.noRecentForms}
                </div>
              ) : (
                stats.recentForms.map((form) => (
                  <Link
                    key={form._id}
                    to={`/forms/view/${form._id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {isRTL
                          ? (form.templateId?.title?.ar || form.templateId?.title?.en || '--')
                          : (form.templateId?.title?.en || form.templateId?.title?.ar || '--')}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {(form.organizationId?.branding?.displayName || form.organizationId?.name || '--')} - {form.filledBy?.name || '--'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        {form.status}
                      </span>
                      <span>{formatDate(form.createdAt || form.date, i18n.language)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              {copy.quickActionsTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {copy.quickActionsDescription}
            </p>

            <div className="mt-5 space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-start gap-3 rounded-2xl border border-gray-200 px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
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
        </section>
      </div>
    </Layout>
  );
};

export default PlatformDashboard;
