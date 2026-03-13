import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import api from '../../utils/api';
import { formatDateTime } from '../../utils/dateUtils';
import { showError, showSuccess } from '../../utils/toast';
import { getRoleBadgeColor, getRoleLabel } from '../../utils/organizationUi';

const FEATURE_FIELDS = [
  { key: 'qrCode', label: 'QR codes' },
  { key: 'attendanceManagement', label: 'Attendance' },
  { key: 'leaveManagement', label: 'Leave' },
  { key: 'messaging', label: 'Messaging' }
];

const LIMIT_FIELDS = [
  { key: 'usersTotal', label: 'Active users' },
  { key: 'templatesTotal', label: 'Templates' },
  { key: 'formsPerMonth', label: 'Forms / month' },
  { key: 'messagesPerMonth', label: 'Messages / month' }
];

const TAB_OPTIONS = [
  { id: 'platform', label: 'Platform Profile', icon: FaCog },
  { id: 'security', label: 'Security', icon: FaShieldAlt },
  { id: 'plans', label: 'Subscription Plans', icon: FaLayerGroup }
];

const buildProfileForm = (profile = {}) => ({
  platformName: profile.platformName || '',
  supportEmail: profile.supportEmail || '',
  websiteUrl: profile.websiteUrl || '',
  locale: profile.locale || 'en',
  timezone: profile.timezone || 'Africa/Cairo',
  defaultOrganizationPlan: profile.defaultOrganizationPlan || 'free',
  allowOrganizationRegistration: profile.allowOrganizationRegistration !== false
});

const buildPlanForm = (plan = null) => ({
  code: plan?.code || '',
  nameEn: plan?.name?.en || '',
  nameAr: plan?.name?.ar || '',
  descriptionEn: plan?.description?.en || '',
  descriptionAr: plan?.description?.ar || '',
  monthlyAmount: plan?.pricing?.monthly?.amount ?? 0,
  yearlyAmount: plan?.pricing?.yearly?.amount ?? 0,
  currency: plan?.market?.currency || plan?.pricing?.monthly?.currency || 'SAR',
  primaryRegion: plan?.market?.primaryRegion || 'MENA',
  primaryCountry: plan?.market?.primaryCountry || 'SA',
  isActive: plan?.isActive !== false,
  sortOrder: plan?.sortOrder ?? 0,
  features: FEATURE_FIELDS.reduce((result, entry) => ({
    ...result,
    [entry.key]: Boolean(plan?.features?.[entry.key])
  }), {}),
  limits: LIMIT_FIELDS.reduce((result, entry) => ({
    ...result,
    [entry.key]: plan?.limits?.[entry.key] ?? ''
  }), {})
});

const getUserId = (user) => user?._id || user?.id || '';

const getUserOrganizationId = (user) => (
  user?.organizationId?._id
  || user?.organizationId?.id
  || user?.organizationId
  || ''
);

const getUserOrganizationName = (user) => (
  user?.organizationId?.branding?.displayName
  || user?.organizationId?.name
  || 'Platform'
);

const getPlanName = (plan, language = 'en') => (
  plan?.name?.[language]
  || plan?.name?.en
  || String(plan?.code || '').toUpperCase()
);

const getPlanDescription = (plan, language = 'en') => (
  plan?.description?.[language]
  || plan?.description?.en
  || ''
);

const formatMoney = (amount, currency = 'SAR') => {
  const normalizedAmount = Number(amount) || 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'SAR').toUpperCase(),
      maximumFractionDigits: normalizedAmount % 1 === 0 ? 0 : 2
    }).format(normalizedAmount);
  } catch (error) {
    return `${normalizedAmount} ${currency || 'SAR'}`;
  }
};

const formatLimitValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Unlimited';
  }

  return Number(value).toLocaleString();
};

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
    <Modal isOpen={Boolean(user)} onClose={onClose} size="md" title="Reset Password">
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{user?.name || '--'}</p>
          <p className="mt-1 text-sm text-gray-600">{user?.email || '--'}</p>
          <p className="mt-1 text-xs text-gray-500">{getUserOrganizationName(user)}</p>
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
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
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
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanCode, setEditingPlanCode] = useState('');
  const [planForm, setPlanForm] = useState(buildPlanForm());

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
      showError(error.response?.data?.message || 'Unable to load platform settings.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      showError(error.response?.data?.message || 'Unable to load reset requests.');
    } finally {
      setResetLoading(false);
    }
  }, []);

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
      showError(error.response?.data?.message || 'Unable to load users.');
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformSettings();
  }, [loadPlatformSettings]);

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

  const summaryCards = [
    {
      label: 'Organizations',
      value: settingsData.summary.organizationsTotal || 0,
      helper: `${settingsData.summary.organizationsActive || 0} active`,
      icon: FaBuilding
    },
    {
      label: 'Users',
      value: settingsData.summary.usersTotal || 0,
      helper: `${settingsData.summary.usersActive || 0} active`,
      icon: FaUsers
    },
    {
      label: 'Reset Requests',
      value: settingsData.summary.resetRequests || 0,
      helper: 'Need admin action',
      icon: FaKey
    },
    {
      label: 'Plans',
      value: activePlansCount,
      helper: `${settingsData.plans.length || 0} total`,
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
      showSuccess('Platform settings updated successfully.');
    } catch (error) {
      console.error('Error saving platform settings:', error);
      showError(error.response?.data?.message || 'Unable to save platform settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreatePlanModal = () => {
    setEditingPlanCode('');
    setPlanForm(buildPlanForm());
    setPlanModalOpen(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlanCode(plan?.code || '');
    setPlanForm(buildPlanForm(plan));
    setPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setPlanModalOpen(false);
    setEditingPlanCode('');
    setPlanForm(buildPlanForm());
  };

  const handlePlanFieldChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name.startsWith('features.')) {
      const featureKey = name.split('.')[1];
      setPlanForm((currentValue) => ({
        ...currentValue,
        features: {
          ...currentValue.features,
          [featureKey]: type === 'checkbox' ? checked : value
        }
      }));
      return;
    }

    if (name.startsWith('limits.')) {
      const limitKey = name.split('.')[1];
      setPlanForm((currentValue) => ({
        ...currentValue,
        limits: {
          ...currentValue.limits,
          [limitKey]: value
        }
      }));
      return;
    }

    setPlanForm((currentValue) => ({
      ...currentValue,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanSave = async (event) => {
    event.preventDefault();
    setPlanSaving(true);

    try {
      const payload = {
        code: planForm.code.trim(),
        name: {
          en: planForm.nameEn.trim(),
          ar: planForm.nameAr.trim()
        },
        description: {
          en: planForm.descriptionEn.trim(),
          ar: planForm.descriptionAr.trim()
        },
        market: {
          primaryRegion: planForm.primaryRegion.trim(),
          primaryCountry: planForm.primaryCountry.trim(),
          currency: planForm.currency.trim().toUpperCase()
        },
        pricing: {
          monthly: {
            amount: Number(planForm.monthlyAmount) || 0,
            currency: planForm.currency.trim().toUpperCase()
          },
          yearly: {
            amount: Number(planForm.yearlyAmount) || 0,
            currency: planForm.currency.trim().toUpperCase()
          }
        },
        features: planForm.features,
        limits: LIMIT_FIELDS.reduce((result, entry) => ({
          ...result,
          [entry.key]: planForm.limits[entry.key]
        }), {}),
        isActive: planForm.isActive,
        sortOrder: Number(planForm.sortOrder) || 0
      };

      if (editingPlanCode) {
        await api.put(`/platform/plans/${editingPlanCode}`, payload);
        showSuccess('Subscription plan updated successfully.');
      } else {
        await api.post('/platform/plans', payload);
        showSuccess('Subscription plan created successfully.');
      }

      closePlanModal();
      await loadPlatformSettings();
    } catch (error) {
      console.error('Error saving plan:', error);
      showError(error.response?.data?.message || 'Unable to save subscription plan.');
    } finally {
      setPlanSaving(false);
    }
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
                title={profileForm.platformName || 'Platform Settings'}
                description="Manage the platform profile, security workflows, and subscription catalog."
                titleClass="text-white"
                descriptionClass="text-white/80"
              />
            </div>

            <Button onClick={loadPlatformSettings} icon={FaSyncAlt}>
              Refresh
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

      <div className="flex overflow-x-auto border-b border-gray-200">
        <nav className="-mb-px flex gap-3">
          {TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-2 py-4 text-sm font-semibold transition-colors ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
              >
                <Icon className="text-sm" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'platform' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FaGlobe className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Platform Profile</h2>
                <p className="mt-1 text-sm text-gray-500">
                  These settings shape the default experience for the whole system.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Platform Name"
                name="platformName"
                value={profileForm.platformName}
                onChange={handleProfileFieldChange}
                required
              />
              <Input
                label="Support Email"
                name="supportEmail"
                type="email"
                value={profileForm.supportEmail}
                onChange={handleProfileFieldChange}
                icon={FaEnvelope}
              />
              <Input
                label="Website URL"
                name="websiteUrl"
                value={profileForm.websiteUrl}
                onChange={handleProfileFieldChange}
                icon={FaGlobe}
              />
              <Input
                label="Timezone"
                name="timezone"
                value={profileForm.timezone}
                onChange={handleProfileFieldChange}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Locale</label>
                <select
                  name="locale"
                  value={profileForm.locale}
                  onChange={handleProfileFieldChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Default Organization Plan
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
                    Allow new organization registration
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Turn this off when onboarding should be fully controlled by the platform team.
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
                {savingProfile ? 'Saving...' : 'Save Platform Settings'}
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
                  <h2 className="text-xl font-bold text-gray-900">Password Reset Requests</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Review users who asked for help, then reset passwords directly from here.
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={loadResetRequests} icon={FaSyncAlt}>
                Refresh Requests
              </Button>
            </div>

            {resetLoading ? (
              <div className="py-10">
                <Loading />
              </div>
            ) : resetRequests.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No pending password reset requests right now.
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
                        Requested
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p className="truncate">
                        <span className="font-semibold text-gray-900">Organization:</span>{' '}
                        {getUserOrganizationName(user)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Requested:</span>{' '}
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
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-5">
                      <Button
                        fullWidth
                        onClick={() => setSelectedUser(user)}
                        icon={FaKey}
                      >
                        Reset Password
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
                <h2 className="text-xl font-bold text-gray-900">Reset Any User</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Search across the whole system and reset any account without leaving settings.
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
                  placeholder="Search by name, email, or organization"
                  className="w-full rounded-2xl border border-gray-300 py-3 pl-11 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" icon={FaSearch}>
                  Search
                </Button>
                <Button type="button" variant="outline" onClick={() => searchUsers(userSearch)} icon={FaSyncAlt}>
                  Refresh
                </Button>
              </div>
            </form>

            {userLoading ? (
              <div className="py-10">
                <Loading />
              </div>
            ) : userResults.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No users matched this search.
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
                          Waiting
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          Ready
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Organization
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900">
                          {getUserOrganizationName(user)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Role
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.organizationRole || user.role)}`}>
                            {getRoleLabel(user.organizationRole || user.role, t, i18n.language)}
                          </span>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                            }`}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-500">
                        {user.passwordResetRequested
                          ? 'User already asked for help.'
                          : 'Manual reset available.'}
                      </p>
                      <Button onClick={() => setSelectedUser(user)} icon={FaKey}>
                        Reset
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
                  <h2 className="text-xl font-bold text-gray-900">Subscription Catalog</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Edit built-in plans, tune limits, or add new offers for the platform.
                  </p>
                </div>
              </div>

              <Button onClick={openCreatePlanModal} icon={FaPlus}>
                Add Plan
              </Button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {settingsData.plans.map((plan) => (
                <div
                  key={plan.code}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                          {plan.code}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold">
                          {getPlanName(plan, i18n.language)}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm text-white/75">
                          {getPlanDescription(plan, i18n.language) || 'No description provided.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plan.isActive !== false
                          ? 'bg-emerald-500/20 text-emerald-100'
                          : 'bg-white/15 text-white/85'
                          }`}>
                          {plan.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/85">
                          {plan.isDefault ? 'Built-in' : 'Custom'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Monthly
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          {formatMoney(plan.pricing?.monthly?.amount, plan.market?.currency)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Yearly
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          {formatMoney(plan.pricing?.yearly?.amount, plan.market?.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Features
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {FEATURE_FIELDS.map((feature) => (
                            <span
                              key={feature.key}
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plan.features?.[feature.key]
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {feature.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Limits
                        </p>
                        <div className="mt-3 grid gap-2">
                          {LIMIT_FIELDS.map((limit) => (
                            <div
                              key={limit.key}
                              className="flex items-center justify-between rounded-2xl border border-gray-200 px-3 py-2 text-sm"
                            >
                              <span className="text-gray-600">{limit.label}</span>
                              <span className="font-semibold text-gray-900">
                                {formatLimitValue(plan.limits?.[limit.key])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaCheckCircle className="text-emerald-600" />
                        {plan.market?.primaryRegion || 'MENA'} / {plan.market?.primaryCountry || 'SA'}
                      </div>
                      <Button variant="outline" onClick={() => openEditPlanModal(plan)} icon={FaEdit}>
                        Edit Plan
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <ResetPasswordModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSuccess={handleResetSuccess}
      />

      <Modal
        isOpen={planModalOpen}
        onClose={closePlanModal}
        size="xl"
        title={editingPlanCode ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
      >
        <form onSubmit={handlePlanSave} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Plan Code"
              name="code"
              value={planForm.code}
              onChange={handlePlanFieldChange}
              disabled={Boolean(editingPlanCode)}
              required
            />
            <Input
              label="Sort Order"
              name="sortOrder"
              type="number"
              value={planForm.sortOrder}
              onChange={handlePlanFieldChange}
            />
            <Input
              label="Name (English)"
              name="nameEn"
              value={planForm.nameEn}
              onChange={handlePlanFieldChange}
              required
            />
            <Input
              label="Name (Arabic)"
              name="nameAr"
              value={planForm.nameAr}
              onChange={handlePlanFieldChange}
            />
            <Input
              label="Monthly Price"
              name="monthlyAmount"
              type="number"
              value={planForm.monthlyAmount}
              onChange={handlePlanFieldChange}
            />
            <Input
              label="Yearly Price"
              name="yearlyAmount"
              type="number"
              value={planForm.yearlyAmount}
              onChange={handlePlanFieldChange}
            />
            <Input
              label="Currency"
              name="currency"
              value={planForm.currency}
              onChange={handlePlanFieldChange}
            />
            <Input
              label="Primary Region"
              name="primaryRegion"
              value={planForm.primaryRegion}
              onChange={handlePlanFieldChange}
            />
            <Input
              label="Primary Country"
              name="primaryCountry"
              value={planForm.primaryCountry}
              onChange={handlePlanFieldChange}
            />
            <div className="rounded-2xl border border-gray-200 px-4 py-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900">Plan is active</span>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={planForm.isActive}
                  onChange={handlePlanFieldChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Description (English)</label>
              <textarea
                name="descriptionEn"
                value={planForm.descriptionEn}
                onChange={handlePlanFieldChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Description (Arabic)</label>
              <textarea
                name="descriptionAr"
                value={planForm.descriptionAr}
                onChange={handlePlanFieldChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Features</h3>
              <div className="mt-4 space-y-3">
                {FEATURE_FIELDS.map((feature) => (
                  <label
                    key={feature.key}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                    <input
                      type="checkbox"
                      name={`features.${feature.key}`}
                      checked={Boolean(planForm.features[feature.key])}
                      onChange={handlePlanFieldChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Limits</h3>
              <p className="mt-1 text-sm text-gray-500">
                Leave a limit blank to keep it unlimited.
              </p>
              <div className="mt-4 grid gap-4">
                {LIMIT_FIELDS.map((limit) => (
                  <Input
                    key={limit.key}
                    label={limit.label}
                    name={`limits.${limit.key}`}
                    type="number"
                    value={planForm.limits[limit.key]}
                    onChange={handlePlanFieldChange}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={closePlanModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={planSaving}>
              {planSaving ? 'Saving...' : (editingPlanCode ? 'Save Plan Changes' : 'Create Plan')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlatformSettings;
