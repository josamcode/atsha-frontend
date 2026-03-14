import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaBuilding,
  FaCheckCircle,
  FaCog,
  FaEdit,
  FaEnvelope,
  FaGlobe,
  FaKey,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaUsers
} from 'react-icons/fa';
import Button from '../Common/Button';
import Card from '../Common/Card';
import Input from '../Common/Input';
import Loading from '../Common/Loading';
import Modal from '../Common/Modal';
import PageTitle from '../Common/PageTilte';
import Tabs from '../Common/Tabs';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/dateUtils';
import { showError, showSuccess } from '../../utils/toast';
import { getRoleBadgeColor, getRoleLabel } from '../../utils/organizationUi';
import {
  FEATURE_FIELDS,
  LIMIT_FIELDS,
  formatLimitValue,
  formatMoney,
  getPlanDescription,
  getPlanName
} from './planUtils';

const TAB_OPTIONS = [
  { id: 'platform', labelKey: 'platformSettings.tabs.platform', icon: FaCog },
  { id: 'security', labelKey: 'platformSettings.tabs.security', icon: FaShieldAlt },
  { id: 'plans', labelKey: 'platformSettings.tabs.plans', icon: FaLayerGroup }
];

const getActiveTabFromSearch = (search = '') => {
  const activeTab = new URLSearchParams(search).get('tab');
  return TAB_OPTIONS.some((tab) => tab.id === activeTab) ? activeTab : 'platform';
};

const buildProfileForm = (profile = {}) => ({
  platformName: profile.platformName || '',
  supportEmail: profile.supportEmail || '',
  websiteUrl: profile.websiteUrl || '',
  locale: profile.locale || 'en',
  timezone: profile.timezone || 'Africa/Cairo',
  defaultOrganizationPlan: profile.defaultOrganizationPlan || 'free',
  allowOrganizationRegistration: profile.allowOrganizationRegistration !== false
});

const getUserId = (user) => user?._id || user?.id || '';

const getUserOrganizationId = (user) => (
  user?.organizationId?._id
  || user?.organizationId?.id
  || user?.organizationId
  || ''
);

const getUserOrganizationName = (user, fallbackLabel = 'Platform') => (
  user?.organizationId?.branding?.displayName
  || user?.organizationId?.name
  || fallbackLabel
);


const ResetPasswordModal = ({ user, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      const payload = { newPassword };
      const organizationId = getUserOrganizationId(user);

      if (organizationId) {
        payload.organizationId = organizationId;
      }

      await api.put(`/users/${getUserId(user)}/reset-password`, payload);
      showSuccess(t('users.passwordResetSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.response?.data?.message || t('users.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={Boolean(user)} onClose={onClose} size="md" title={t('users.resetPassword')}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{user?.name || '--'}</p>
          <p className="mt-1 text-sm text-gray-600">{user?.email || '--'}</p>
          <p className="mt-1 text-xs text-gray-500">
            {getUserOrganizationName(user, t('platformSettings.common.platform'))}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('users.newPassword')}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <Input
            label={t('users.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('users.resetPassword')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const PlatformSettings = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromSearch(location.search));
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [settingsData, setSettingsData] = useState({
    profile: buildProfileForm(),
    plans: [],
    summary: {}
  });
  const [profileForm, setProfileForm] = useState(buildProfileForm());
  const [resetRequests, setResetRequests] = useState([]);
  const [resetLoading, setResetLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadPlatformSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/platform/settings');
      const nextData = {
        profile: response.data?.data?.profile || buildProfileForm(),
        plans: response.data?.data?.plans || [],
        summary: response.data?.data?.summary || {}
      };

      setSettingsData(nextData);
      setProfileForm(buildProfileForm(nextData.profile));
    } catch (error) {
      console.error('Error loading platform settings:', error);
      showError(error.response?.data?.message || t('platformSettings.feedback.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadResetRequests = useCallback(async () => {
    try {
      setResetLoading(true);
      const response = await api.get('/users', {
        params: {
          scope: 'system',
          passwordResetRequested: true,
          limit: 12,
          sort: '-updatedAt'
        }
      });

      setResetRequests(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error loading password reset requests:', error);
      showError(error.response?.data?.message || t('platformSettings.feedback.loadResetRequestsError'));
    } finally {
      setResetLoading(false);
    }
  }, [t]);

  const searchUsers = useCallback(async (searchValue = '') => {
    try {
      setUserLoading(true);
      const params = {
        scope: 'system',
        limit: 12,
        sort: 'name'
      };

      if (String(searchValue || '').trim()) {
        params.search = String(searchValue || '').trim();
      }

      const response = await api.get('/users', { params });
      setUserResults(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error loading users for password resets:', error);
      showError(error.response?.data?.message || t('platformSettings.feedback.loadUsersError'));
    } finally {
      setUserLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPlatformSettings();
  }, [loadPlatformSettings]);

  useEffect(() => {
    setActiveTab(getActiveTabFromSearch(location.search));
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'security') {
      loadResetRequests();
      searchUsers('');
    }
  }, [activeTab, loadResetRequests, searchUsers]);

  const activePlansCount = useMemo(() => (
    settingsData.plans.filter((plan) => plan.isActive !== false).length
  ), [settingsData.plans]);

  const availablePlanOptions = useMemo(() => (
    settingsData.plans.filter((plan) => plan.isActive !== false)
  ), [settingsData.plans]);
  const translatedTabs = useMemo(() => (
    TAB_OPTIONS.map((tab) => ({
      ...tab,
      label: t(tab.labelKey)
    }))
  ), [t]);

  const getFeatureLabel = useCallback((feature) => (
    t(feature.labelKey, {
      defaultValue: feature.key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    })
  ), [t]);

  const getLimitLabel = useCallback((limit) => (
    t(limit.labelKey, {
      defaultValue: limit.key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    })
  ), [t]);

  const summaryCards = [
    {
      label: t('platformSettings.summary.organizations.label'),
      value: settingsData.summary.organizationsTotal || 0,
      helper: t('platformSettings.summary.organizations.helper', {
        count: settingsData.summary.organizationsActive || 0
      }),
      icon: FaBuilding
    },
    {
      label: t('platformSettings.summary.users.label'),
      value: settingsData.summary.usersTotal || 0,
      helper: t('platformSettings.summary.users.helper', {
        count: settingsData.summary.usersActive || 0
      }),
      icon: FaUsers
    },
    {
      label: t('platformSettings.summary.resetRequests.label'),
      value: settingsData.summary.resetRequests || 0,
      helper: t('platformSettings.summary.resetRequests.helper'),
      icon: FaKey
    },
    {
      label: t('platformSettings.summary.plans.label'),
      value: activePlansCount,
      helper: t('platformSettings.summary.plans.helper', {
        count: settingsData.plans.length || 0
      }),
      icon: FaLayerGroup
    }
  ];

  const handleProfileFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProfileForm((currentValue) => ({
      ...currentValue,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await api.put('/platform/settings', {
        profile: profileForm
      });

      const nextData = {
        profile: response.data?.data?.profile || profileForm,
        plans: response.data?.data?.plans || settingsData.plans,
        summary: response.data?.data?.summary || settingsData.summary
      };

      setSettingsData(nextData);
      setProfileForm(buildProfileForm(nextData.profile));
      showSuccess(t('platformSettings.feedback.saveProfileSuccess'));
    } catch (error) {
      console.error('Error saving platform settings:', error);
      showError(error.response?.data?.message || t('platformSettings.feedback.saveProfileError'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTabChange = (nextTab) => {
    const params = new URLSearchParams(location.search);

    if (nextTab === 'platform') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab);
    }

    setActiveTab(nextTab);
    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : ''
    }, { replace: true });
  };

  const plansTabPath = `${location.pathname}?tab=plans`;

  const openCreatePlanPage = () => {
    navigate('/platform/plans/new', {
      state: {
        returnTo: plansTabPath
      }
    });
  };

  const openEditPlanPage = (plan) => {
    navigate(`/platform/plans/${encodeURIComponent(plan?.code || '')}/edit`, {
      state: {
        plan,
        returnTo: plansTabPath
      }
    });
  };

  const handleUserSearchSubmit = (event) => {
    event.preventDefault();
    searchUsers(userSearch);
  };

  const handleResetSuccess = async () => {
    setSelectedUser(null);
    await Promise.all([
      loadPlatformSettings(),
      loadResetRequests(),
      searchUsers(userSearch)
    ]);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                <FaCog className="text-2xl" />
              </div>
              <PageTitle
                title={profileForm.platformName || t('platformSettings.header.title')}
                description={t('platformSettings.header.description')}
                titleClass="text-white"
                descriptionClass="text-white/80"
              />
            </div>

            <Button onClick={loadPlatformSettings} icon={FaSyncAlt}>
              {t('platformSettings.actions.refresh')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-200 bg-gray-50 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <Icon className="text-lg" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Tabs
        tabs={translatedTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        buttonClassName="whitespace-nowrap border-b-2 px-2 py-4 text-sm font-semibold transition-colors"
      />

      {activeTab === 'platform' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FaGlobe className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('platformSettings.profile.title')}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('platformSettings.profile.description')}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label={t('platformSettings.profile.fields.platformName')}
                name="platformName"
                value={profileForm.platformName}
                onChange={handleProfileFieldChange}
                required
              />
              <Input
                label={t('platformSettings.profile.fields.supportEmail')}
                name="supportEmail"
                type="email"
                value={profileForm.supportEmail}
                onChange={handleProfileFieldChange}
                icon={FaEnvelope}
              />
              <Input
                label={t('platformSettings.profile.fields.websiteUrl')}
                name="websiteUrl"
                value={profileForm.websiteUrl}
                onChange={handleProfileFieldChange}
                icon={FaGlobe}
              />
              <Input
                label={t('platformSettings.profile.fields.timezone')}
                name="timezone"
                value={profileForm.timezone}
                onChange={handleProfileFieldChange}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('platformSettings.profile.fields.locale')}
                </label>
                <select
                  name="locale"
                  value={profileForm.locale}
                  onChange={handleProfileFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="en">{t('organizationSettings.languageOptions.en')}</option>
                  <option value="ar">{t('organizationSettings.languageOptions.ar')}</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('platformSettings.profile.fields.defaultOrganizationPlan')}
                </label>
                <select
                  name="defaultOrganizationPlan"
                  value={profileForm.defaultOrganizationPlan}
                  onChange={handleProfileFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {availablePlanOptions.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {getPlanName(plan, i18n.language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t('platformSettings.profile.allowRegistration.title')}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('platformSettings.profile.allowRegistration.description')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="allowOrganizationRegistration"
                  checked={profileForm.allowOrganizationRegistration}
                  onChange={handleProfileFieldChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? t('common.saving') : t('platformSettings.actions.saveProfile')}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FaKey className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('platformSettings.security.requests.title')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('platformSettings.security.requests.description')}
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={loadResetRequests} icon={FaSyncAlt}>
                {t('platformSettings.actions.refreshRequests')}
              </Button>
            </div>

            {resetLoading ? (
              <div className="py-10">
                <Loading />
              </div>
            ) : resetRequests.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                {t('platformSettings.security.requests.empty')}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resetRequests.map((user) => (
                  <div
                    key={getUserId(user)}
                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-gray-900">{user.name}</p>
                        <p className="truncate text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {t('platformSettings.security.requests.requested')}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p className="truncate">
                        <span className="font-semibold text-gray-900">
                          {t('platformSettings.common.organizationLabel')}:
                        </span>{' '}
                        {getUserOrganizationName(user, t('platformSettings.common.platform'))}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          {t('platformSettings.security.requests.requestedAt')}:
                        </span>{' '}
                        {formatDateTime(
                          user.passwordResetRequestDate || user.updatedAt,
                          i18n.language
                        )}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.organizationRole || user.role)}`}>
                        {getRoleLabel(user.organizationRole || user.role, t, i18n.language)}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {user.isActive !== false ? t('users.active') : t('users.inactive')}
                      </span>
                    </div>

                    <div className="mt-5">
                      <Button
                        fullWidth
                        onClick={() => setSelectedUser(user)}
                        icon={FaKey}
                      >
                        {t('users.resetPassword')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FaUsers className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t('platformSettings.security.search.title')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('platformSettings.security.search.description')}
                </p>
              </div>
            </div>

            <form onSubmit={handleUserSearchSubmit} className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder={t('platformSettings.security.search.placeholder')}
                  className="w-full rounded-2xl border border-gray-300 py-3 pl-11 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" icon={FaSearch}>
                  {t('common.search')}
                </Button>
                <Button type="button" variant="outline" onClick={() => searchUsers(userSearch)} icon={FaSyncAlt}>
                  {t('platformSettings.actions.refresh')}
                </Button>
              </div>
            </form>

            {userLoading ? (
              <div className="py-10">
                <Loading />
              </div>
            ) : userResults.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                {t('platformSettings.security.search.empty')}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {userResults.map((user) => (
                  <div
                    key={getUserId(user)}
                    className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-primary/5 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-gray-900">{user.name}</p>
                        <p className="truncate text-sm text-gray-500">{user.email}</p>
                      </div>

                      {user.passwordResetRequested ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          {t('platformSettings.security.search.waiting')}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {t('platformSettings.security.search.ready')}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {t('platformSettings.common.organization')}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900">
                          {getUserOrganizationName(user, t('platformSettings.common.platform'))}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {t('users.role')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.organizationRole || user.role)}`}>
                            {getRoleLabel(user.organizationRole || user.role, t, i18n.language)}
                          </span>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                            }`}>
                            {user.isActive !== false ? t('users.active') : t('users.inactive')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-500">
                        {user.passwordResetRequested
                          ? t('platformSettings.security.search.requestedHelp')
                          : t('platformSettings.security.search.manualReset')}
                      </p>
                      <Button onClick={() => setSelectedUser(user)} icon={FaKey}>
                        {t('platformSettings.actions.reset')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FaLayerGroup className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('platformSettings.plan.title')}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('platformSettings.plan.description')}
                  </p>
                </div>
              </div>

              <Button onClick={openCreatePlanPage} icon={FaPlus}>
                {t('platformSettings.actions.addPlan')}
              </Button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {settingsData.plans.map((plan) => {
                const enabledFeaturesCount = FEATURE_FIELDS.filter(
                  (feature) => Boolean(plan.features?.[feature.key])
                ).length;
                const planLocation = `${plan.market?.primaryRegion || 'MENA'} / ${plan.market?.primaryCountry || 'SA'}`;

                return (
                  <div
                    key={plan.code}
                    className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-42px_rgba(15,23,42,0.55)]"
                  >
                    <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white">
                      <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                      <div className="relative space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                              {plan.code}
                            </span>
                            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                              {getPlanName(plan, i18n.language)}
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200/85">
                              {getPlanDescription(plan, i18n.language) || t('platformSettings.plan.noDescription')}
                            </p>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${plan.isActive !== false
                              ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30'
                              : 'bg-white/10 text-white/80 ring-white/15'
                              }`}>
                              {plan.isActive !== false ? t('users.active') : t('users.inactive')}
                            </span>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${plan.isDefault
                              ? 'bg-amber-400/15 text-amber-100 ring-amber-300/30'
                              : 'bg-sky-400/15 text-sky-100 ring-sky-300/30'
                              }`}>
                              {plan.isDefault ? t('platformSettings.plan.badges.builtIn') : t('platformSettings.plan.badges.custom')}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                              {t('platformSettings.plan.monthly')}
                            </p>
                            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                              {formatMoney(plan.pricing?.monthly?.amount, plan.market?.currency, locale)}
                            </p>
                          </div>
                          <div className="rounded-3xl border border-white/10 bg-slate-950/25 px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                              {t('platformSettings.plan.yearly')}
                            </p>
                            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                              {formatMoney(plan.pricing?.yearly?.amount, plan.market?.currency, locale)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-5 p-6">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {t('platformSettings.plan.featuresTitle')}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {enabledFeaturesCount}/{FEATURE_FIELDS.length}
                              </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                              <FaCheckCircle className="text-lg" />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2.5">
                            {FEATURE_FIELDS.map((feature) => {
                              const isEnabled = Boolean(plan.features?.[feature.key]);

                              return (
                                <div
                                  key={feature.key}
                                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors ${isEnabled
                                    ? 'bg-white text-slate-700 shadow-sm ring-1 ring-emerald-100'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isEnabled
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-white text-slate-300'
                                    }`}>
                                    <FaCheckCircle className="text-xs" />
                                  </span>
                                  <span className={`font-medium ${isEnabled ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {getFeatureLabel(feature)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {t('platformSettings.plan.limitsTitle')}
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-500">
                                {planLocation}
                              </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                              <FaGlobe className="text-lg" />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {LIMIT_FIELDS.map((limit) => (
                              <div
                                key={limit.key}
                                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                              >
                                <span className="text-sm text-slate-500">{getLimitLabel(limit)}</span>
                                <span className="text-sm font-semibold text-slate-900">
                                  {formatLimitValue(plan.limits?.[limit.key], t, locale)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            <FaGlobe className="text-slate-500" />
                            {planLocation}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <FaUsers className="text-emerald-600" />
                            {enabledFeaturesCount}/{FEATURE_FIELDS.length}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => openEditPlanPage(plan)}
                          icon={FaEdit}
                          className="min-w-[150px] rounded-2xl border-slate-300 text-slate-700 hover:border-primary"
                        >
                          {t('platformSettings.actions.editPlan')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      <ResetPasswordModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSuccess={handleResetSuccess}
      />

    </div>
  );
};

export default PlatformSettings;
