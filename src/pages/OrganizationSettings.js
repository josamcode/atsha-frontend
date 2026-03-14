import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaBuilding,
  FaEnvelope,
  FaGlobe,
  FaPlus,
  FaTimes,
  FaUserPlus,
  FaUsers
} from 'react-icons/fa';
import Layout from '../components/Layout/Layout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Input from '../components/Common/Input';
import Loading from '../components/Common/Loading';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { isPlatformAdmin } from '../utils/organization';
import {
  getAssignableRoleOptions,
  getDepartmentLabel,
  getDepartmentOptions,
  getRoleLabel
} from '../utils/organizationUi';
import PageTitle from '../components/Common/PageTilte';
import PlatformSettings from '../components/Platform/PlatformSettings';

const normalizeDepartmentCode = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildDepartmentDraft = (index = 0) => ({
  code: '',
  nameEn: '',
  nameAr: '',
  isActive: true,
  sortOrder: index
});

const buildSettingsState = (source) => ({
  id: source?.id || source?._id || null,
  name: source?.name || '',
  slug: source?.slug || '',
  status: source?.status || 'active',
  locale: source?.locale || 'en',
  timezone: source?.timezone || 'Africa/Cairo',
  allowedDomainsText: Array.isArray(source?.allowedDomains) ? source.allowedDomains.join('\n') : '',
  branding: {
    displayName: source?.branding?.displayName || '',
    shortName: source?.branding?.shortName || '',
    supportEmail: source?.branding?.supportEmail || '',
    emailFromName: source?.branding?.emailFromName || '',
    websiteUrl: source?.branding?.websiteUrl || '',
    primaryColor: source?.branding?.primaryColor || '#01c853',
    secondaryColor: source?.branding?.secondaryColor || '#059669'
  },
  securitySettings: {
    requireDomainMatch: source?.securitySettings?.requireDomainMatch === true,
    passwordResetEnabled: source?.securitySettings?.passwordResetEnabled !== false
  },
  attendanceSettings: {
    qrTokenValiditySeconds: source?.attendanceSettings?.qrTokenValiditySeconds || 30,
    allowPublicAttendance: source?.attendanceSettings?.allowPublicAttendance !== false
  },
  leaveSettings: {
    approvalRequired: source?.leaveSettings?.approvalRequired !== false,
    defaultAnnualBalance: source?.leaveSettings?.defaultAnnualBalance || 0
  },
  featureFlags: source?.featureFlags || {},
  subscription: source?.subscription || null,
  summary: source?.summary || {},
  departments: Array.isArray(source?.departments) && source.departments.length > 0
    ? source.departments.map((department, index) => ({
      code: department.code || '',
      nameEn: department.name?.en || '',
      nameAr: department.name?.ar || '',
      isActive: department.isActive !== false,
      sortOrder: department.sortOrder ?? index
    }))
    : [buildDepartmentDraft()]
});

const OrganizationSettings = () => {
  const { t, i18n } = useTranslation();
  const { user, organization } = useAuth();
  const { setOrganizationContext, refreshOrganization } = useOrganization();
  const isRTL = i18n.language === 'ar';
  const platformAdminView = isPlatformAdmin(user);
  const activeLocale = isRTL ? 'ar-EG' : 'en-US';
  const [settings, setSettings] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [latestActivationUrl, setLatestActivationUrl] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'employee',
    department: '',
    languagePreference: 'en',
    expiresInDays: 7
  });
  const [activeTab, setActiveTab] = useState('general');

  const roleOptions = getAssignableRoleOptions(user, t, i18n.language);
  const departmentOptions = getDepartmentOptions(settings || organization, t, i18n.language);
  const getOrganizationStatusLabel = (status) => (
    t(`organizationSettings.organizationStatus.${status}`, { defaultValue: status || '--' })
  );
  const getInvitationStatusLabel = (status) => (
    t(`organizationSettings.invitationStatus.${status}`, { defaultValue: status || '--' })
  );
  const getFeatureFlagLabel = (key) => t(`organizationSettings.featureFlags.${key}`, {
    defaultValue: String(key || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  });
  const getSubscriptionStatusLabel = (status) => t(`organizationSettings.subscription.statuses.${status}`, {
    defaultValue: String(status || '--')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  });
  const getSubscriptionMetricLabel = (key) => t(`organizationSettings.subscription.metrics.${key}`, {
    defaultValue: String(key || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  });
  const getSubscriptionUsageText = (metric) => {
    const used = metric?.used ?? 0;
    const limit = metric?.limit;
    return limit === null || limit === undefined
      ? `${used} / Unlimited`
      : `${used} / ${limit}`;
  };
  const subscriptionPlanName = settings?.subscription?.plan?.name?.[i18n.language]
    || settings?.subscription?.plan?.name?.en
    || settings?.subscription?.effectivePlanCode
    || settings?.subscription?.subscribedPlanCode
    || '--';
  const subscriptionUsageEntries = Object.entries(settings?.subscription?.usage || {});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsResponse, invitationsResponse] = await Promise.all([
        api.get('/organizations/current/settings'),
        api.get('/invitations')
      ]);

      const nextSettings = buildSettingsState(settingsResponse.data.data);
      setSettings(nextSettings);
      setInvitations(invitationsResponse.data.data || []);
      setInviteForm((currentValue) => ({
        ...currentValue,
        department: currentValue.department || nextSettings.departments.find((department) => department.isActive)?.code || ''
      }));
    } catch (error) {
      showError(error.response?.data?.message || t('organizationSettings.feedback.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!platformAdminView) {
      loadData();
    }
  }, [loadData, platformAdminView]);

  const updateField = (field, value) => {
    setSettings((currentValue) => ({ ...currentValue, [field]: value }));
  };

  const updateGroupField = (group, field, value) => {
    setSettings((currentValue) => ({
      ...currentValue,
      [group]: {
        ...(currentValue[group] || {}),
        [field]: value
      }
    }));
  };

  const updateDepartment = (index, field, value) => {
    setSettings((currentValue) => ({
      ...currentValue,
      departments: currentValue.departments.map((department, departmentIndex) => (
        departmentIndex === index ? { ...department, [field]: value } : department
      ))
    }));
  };

  const addDepartment = () => {
    setSettings((currentValue) => ({
      ...currentValue,
      departments: [...currentValue.departments, buildDepartmentDraft(currentValue.departments.length)]
    }));
  };

  const removeDepartment = (index) => {
    setSettings((currentValue) => ({
      ...currentValue,
      departments: currentValue.departments.filter((_, departmentIndex) => departmentIndex !== index)
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        locale: settings.locale,
        timezone: settings.timezone,
        allowedDomains: settings.allowedDomainsText
          .split(/[\n,]/)
          .map((value) => value.trim())
          .filter(Boolean),
        branding: settings.branding,
        securitySettings: settings.securitySettings,
        attendanceSettings: {
          ...settings.attendanceSettings,
          qrTokenValiditySeconds: Number(settings.attendanceSettings.qrTokenValiditySeconds) || 30
        },
        leaveSettings: {
          ...settings.leaveSettings,
          defaultAnnualBalance: Number(settings.leaveSettings.defaultAnnualBalance) || 0
        },
        departments: settings.departments
          .map((department, index) => {
            const code = normalizeDepartmentCode(department.code || department.nameEn);
            return {
              code,
              name: {
                en: department.nameEn || code,
                ar: department.nameAr || department.nameEn || code
              },
              isActive: department.isActive !== false,
              sortOrder: index,
              isDefault: code === 'other'
            };
          })
          .filter((department) => department.code)
      };

      const response = await api.put('/organizations/current/settings', payload);
      const updatedOrganization = response.data.data;

      setOrganizationContext(updatedOrganization);
      await refreshOrganization();
      setSettings((currentValue) => ({
        ...buildSettingsState(updatedOrganization),
        summary: currentValue.summary,
        featureFlags: currentValue.featureFlags
      }));
      showSuccess(t('organizationSettings.feedback.saveSuccess'));
    } catch (error) {
      showError(error.response?.data?.message || t('organizationSettings.feedback.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviteLoading(true);
    setLatestActivationUrl('');

    try {
      const response = await api.post('/invitations', {
        email: inviteForm.email,
        role: inviteForm.role,
        department: inviteForm.department,
        departments: inviteForm.role === 'supervisor' && inviteForm.department
          ? [inviteForm.department]
          : [],
        languagePreference: inviteForm.languagePreference,
        expiresInDays: Number(inviteForm.expiresInDays) || 7
      });

      const invitation = response.data.data;
      setInvitations((currentValue) => [invitation, ...currentValue]);
      setSettings((currentValue) => ({
        ...currentValue,
        summary: {
          ...(currentValue.summary || {}),
          pendingInvitations: (currentValue.summary?.pendingInvitations || 0) + 1
        }
      }));
      setLatestActivationUrl(invitation.activationUrl || '');
      setInviteForm((currentValue) => ({
        ...currentValue,
        email: '',
        role: 'employee'
      }));
      showSuccess(t('organizationSettings.feedback.inviteSuccess'));
    } catch (error) {
      showError(error.response?.data?.message || t('organizationSettings.feedback.inviteError'));
    } finally {
      setInviteLoading(false);
    }
  };

  const cancelInvitation = async (invitationId) => {
    try {
      const response = await api.put(`/invitations/${invitationId}/cancel`);
      const cancelledInvitation = response.data.data;
      setInvitations((currentValue) => currentValue.map((invitation) => (
        invitation.id === invitationId || invitation._id === invitationId
          ? cancelledInvitation
          : invitation
      )));
      setSettings((currentValue) => ({
        ...currentValue,
        summary: {
          ...(currentValue.summary || {}),
          pendingInvitations: Math.max(0, (currentValue.summary?.pendingInvitations || 0) - 1)
        }
      }));
      showSuccess(t('organizationSettings.feedback.cancelSuccess'));
    } catch (error) {
      showError(error.response?.data?.message || t('organizationSettings.feedback.cancelError'));
    }
  };

  if (platformAdminView) {
    return (
      <Layout>
        <PlatformSettings />
      </Layout>
    );
  }

  if (loading || !settings) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <FaBuilding className="text-2xl" />
              </div>
              <PageTitle
                title={settings.branding.displayName || settings.name}
                description={`${settings.slug} | ${getOrganizationStatusLabel(settings.status)}`}
                titleClass="text-white"
                descriptionClass="text-white/80"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-[18rem]">
              <div className="rounded-xl bg-white/15 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('organizationSettings.stats.users')}</p>
                <p className="text-2xl font-semibold">{settings.summary.users || 0}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('organizationSettings.stats.active')}</p>
                <p className="text-2xl font-semibold">{settings.summary.activeUsers || 0}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('organizationSettings.stats.invites')}</p>
                <p className="text-2xl font-semibold">{settings.summary.pendingInvitations || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
          <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
            {[
              { id: 'general', label: t('organizationSettings.tabs.general', { defaultValue: 'General' }) },
              { id: 'policies', label: t('organizationSettings.tabs.policies', { defaultValue: 'Policies' }) },
              { id: 'departments', label: t('organizationSettings.sections.departments', { defaultValue: 'Departments' }) },
              { id: 'members', label: t('organizationSettings.sections.invitations', { defaultValue: 'Members & Invitations' }) },
              { id: 'subscription', label: t('organizationSettings.sections.subscription', { defaultValue: 'Subscription & Features' }) }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap flex py-4 px-2 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {['general', 'policies', 'departments'].includes(activeTab) && (
          <form onSubmit={handleSave} className="space-y-6">
            {activeTab === 'general' && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t('organizationSettings.fields.displayName')} value={settings.branding.displayName} onChange={(event) => updateGroupField('branding', 'displayName', event.target.value)} />
                  <Input label={t('organizationSettings.fields.shortName')} value={settings.branding.shortName} onChange={(event) => updateGroupField('branding', 'shortName', event.target.value)} />
                  <Input label={t('organizationSettings.fields.supportEmail')} type="email" value={settings.branding.supportEmail} onChange={(event) => updateGroupField('branding', 'supportEmail', event.target.value)} disabled />
                  <Input label={t('organizationSettings.fields.emailSenderName')} value={settings.branding.emailFromName} onChange={(event) => updateGroupField('branding', 'emailFromName', event.target.value)} />
                  <Input label={t('organizationSettings.fields.websiteUrl')} value={settings.branding.websiteUrl} onChange={(event) => updateGroupField('branding', 'websiteUrl', event.target.value)} />
                  <Input label={t('organizationSettings.fields.timezone')} value={settings.timezone} onChange={(event) => updateField('timezone', event.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizationSettings.fields.locale')}</label>
                    <select
                      value={settings.locale}
                      onChange={(event) => updateField('locale', event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="en">{t('organizationSettings.languageOptions.en')}</option>
                      <option value="ar">{t('organizationSettings.languageOptions.ar')}</option>
                    </select>
                  </div>
                </div>

                <div className={`mt-6 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <Button type="submit" disabled={saving}>{saving ? t('organizationSettings.actions.saving') : t('organizationSettings.actions.saveSettings')}</Button>
                </div>
              </Card>
            )}

            {activeTab === 'policies' && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.passwordResetEnabled')}</span>
                    <input type="checkbox" checked={settings.securitySettings.passwordResetEnabled} onChange={(event) => updateGroupField('securitySettings', 'passwordResetEnabled', event.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.publicAttendance')}</span>
                    <input type="checkbox" checked={settings.attendanceSettings.allowPublicAttendance} onChange={(event) => updateGroupField('attendanceSettings', 'allowPublicAttendance', event.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.leaveApprovalRequired')}</span>
                    <input type="checkbox" checked={settings.leaveSettings.approvalRequired} onChange={(event) => updateGroupField('leaveSettings', 'approvalRequired', event.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                  </label>
                  <Input label={t('organizationSettings.fields.qrValiditySeconds')} type="number" value={settings.attendanceSettings.qrTokenValiditySeconds} onChange={(event) => updateGroupField('attendanceSettings', 'qrTokenValiditySeconds', event.target.value)} />
                  <Input label={t('organizationSettings.fields.defaultAnnualLeave')} type="number" value={settings.leaveSettings.defaultAnnualBalance} onChange={(event) => updateGroupField('leaveSettings', 'defaultAnnualBalance', event.target.value)} />
                </div>

                <div className={`mt-6 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <Button type="submit" disabled={saving}>{saving ? t('organizationSettings.actions.saving') : t('organizationSettings.actions.saveSettings')}</Button>
                </div>
              </Card>
            )}

            {activeTab === 'departments' && (
              <Card>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.departments')}</h2>
                    <p className="text-sm text-gray-500">{t('organizationSettings.sections.departmentsDescription')}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={addDepartment} icon={FaPlus}>{t('organizationSettings.actions.addDepartment')}</Button>
                </div>

                <div className="space-y-3">
                  {settings.departments.map((department, index) => (
                    <div key={`${department.code || 'department'}-${index}`} className="rounded-xl border border-gray-200 p-4 transition-all hover:shadow-sm bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input label={t('organizationSettings.fields.code')} value={department.code} onChange={(event) => updateDepartment(index, 'code', normalizeDepartmentCode(event.target.value))} />
                        <Input label={t('organizationSettings.fields.nameEn')} value={department.nameEn} onChange={(event) => updateDepartment(index, 'nameEn', event.target.value)} />
                        <Input label={t('organizationSettings.fields.nameAr')} value={department.nameAr} onChange={(event) => updateDepartment(index, 'nameAr', event.target.value)} />
                        <div className="flex items-end gap-2">
                          <label className="flex-1 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
                            <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.active')}</span>
                            <input type="checkbox" checked={department.isActive} onChange={(event) => updateDepartment(index, 'isActive', event.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeDepartment(index)}
                            disabled={settings.departments.length === 1}
                            className="h-11 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`mt-6 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <Button type="submit" disabled={saving}>{saving ? t('organizationSettings.actions.saving') : t('organizationSettings.actions.saveSettings')}</Button>
                </div>
              </Card>
            )}
          </form>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FaBuilding className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('organizationSettings.sections.subscription', { defaultValue: 'Subscription' })}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t('organizationSettings.sections.subscriptionDescription', { defaultValue: 'Effective plan, limits, and downgrade enforcement.' })}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">
                      {t('organizationSettings.subscription.currentPlan', { defaultValue: 'Current Plan' })}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionPlanName}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20 shadow-sm">
                    {getSubscriptionStatusLabel(settings.subscription?.status)}
                  </span>
                </div>

                {settings.subscription?.isDowngraded && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
                    <span className="text-amber-500 mt-0.5 text-lg">⚠️</span>
                    <p>
                      {t('organizationSettings.subscription.downgradedNotice', {
                        defaultValue: 'This organization is currently enforced on its downgrade plan because the paid subscription is no longer active.'
                      })}
                    </p>
                  </div>
                )}

                {subscriptionUsageEntries.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200/60">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('organizationSettings.subscription.usage', { defaultValue: 'Usage Limits' })}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {subscriptionUsageEntries.map(([key, metric]) => (
                        <div key={key} className="flex flex-col rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                          <span className="text-xs font-medium text-gray-500 mb-1"><span className="line-clamp-1">{getSubscriptionMetricLabel(key)}</span></span>
                          <span className="text-lg font-semibold text-gray-900">{getSubscriptionUsageText(metric)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FaGlobe className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.featureFlags')}</h2>
                  <p className="text-sm text-gray-500">{t('organizationSettings.sections.featureFlagsDescription')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(settings.featureFlags || {}).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 bg-white">
                    <span className="text-sm font-medium text-gray-700">{getFeatureFlagLabel(key)}</span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {enabled ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FaUserPlus className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.inviteMember')}</h2>
                  <p className="text-sm text-gray-500">{t('organizationSettings.sections.inviteMemberDescription')}</p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t('organizationSettings.fields.email')} type="email" value={inviteForm.email} onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, email: event.target.value }))} required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizationSettings.fields.role')}</label>
                    <select
                      value={inviteForm.role}
                      onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, role: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {roleOptions.filter((option) => option.value !== 'platform_admin').map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizationSettings.fields.department')}</label>
                    <select
                      value={inviteForm.department}
                      onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, department: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {departmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizationSettings.fields.language')}</label>
                      <select
                        value={inviteForm.languagePreference}
                        onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, languagePreference: event.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="en">{t('organizationSettings.languageOptions.en')}</option>
                        <option value="ar">{t('organizationSettings.languageOptions.ar')}</option>
                      </select>
                    </div>
                    <Input label={t('organizationSettings.fields.expiresInDays')} type="number" value={inviteForm.expiresInDays} onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, expiresInDays: event.target.value }))} />
                  </div>
                </div>

                <div className={`mt-4 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <Button type="submit" disabled={inviteLoading}>{inviteLoading ? t('organizationSettings.actions.creatingInvitation') : t('organizationSettings.actions.createInvitation')}</Button>
                </div>
              </form>

              {latestActivationUrl && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{t('organizationSettings.fields.activationLink')}</p>
                    <input readOnly value={latestActivationUrl} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(latestActivationUrl)} className="mt-6">{t('organizationSettings.actions.copyLink', { defaultValue: 'Copy Link' })}</Button>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FaUsers className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.invitations')}</h2>
                    <p className="text-sm text-gray-500">{t('organizationSettings.sections.invitationsDescription')}</p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={loadData}>{t('organizationSettings.actions.refresh')}</Button>
              </div>

              {invitations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-gray-50 flex flex-col items-center justify-center">
                  <FaEnvelope className="text-gray-400 text-3xl mb-3" />
                  <p className="text-gray-500 font-medium">{t('organizationSettings.states.noInvitations')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id || invitation._id} className="rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <span className="font-semibold">{invitation.email}</span>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${invitation.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              {getInvitationStatusLabel(invitation.status)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-gray-600 font-medium">
                              {t('organizationSettings.fields.roleLabel', { defaultValue: 'Role' })}: {getRoleLabel(invitation.organizationRole || invitation.role, t, i18n.language)}
                            </span>
                            <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-gray-600 font-medium">
                              {t('organizationSettings.fields.deptLabel', { defaultValue: 'Dept' })}: {getDepartmentLabel(invitation.department, settings, t, i18n.language)}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1 mx-2">
                              • {t('organizationSettings.fields.expiresLabel', { defaultValue: 'Expires' })}: {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString(activeLocale) : t('organizationSettings.states.notAvailable')}
                            </span>
                          </div>
                        </div>
                        {invitation.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => cancelInvitation(invitation.id || invitation._id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors whitespace-nowrap"
                          >
                            <FaTimes />
                            {t('organizationSettings.actions.cancelInvitation')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrganizationSettings;
