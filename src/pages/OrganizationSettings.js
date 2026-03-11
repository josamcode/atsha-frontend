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
import {
  getAssignableRoleOptions,
  getDepartmentLabel,
  getDepartmentOptions,
  getRoleLabel
} from '../utils/organizationUi';

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
    primaryColor: source?.branding?.primaryColor || '#d4b900',
    secondaryColor: source?.branding?.secondaryColor || '#b51c20'
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

  const roleOptions = getAssignableRoleOptions(user, t, i18n.language);
  const departmentOptions = getDepartmentOptions(settings || organization, t, i18n.language);
  const getOrganizationStatusLabel = (status) => (
    t(`organizationSettings.organizationStatus.${status}`, { defaultValue: status || '--' })
  );
  const getInvitationStatusLabel = (status) => (
    t(`organizationSettings.invitationStatus.${status}`, { defaultValue: status || '--' })
  );

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
    loadData();
  }, [loadData]);

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
              <div>
                <h1 className="text-3xl font-bold text-white">{settings.branding.displayName || settings.name}</h1>
                <p className="text-sm text-white/80 mt-1">{settings.slug} | {getOrganizationStatusLabel(settings.status)}</p>
              </div>
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t('organizationSettings.fields.displayName')} value={settings.branding.displayName} onChange={(event) => updateGroupField('branding', 'displayName', event.target.value)} />
                  <Input label={t('organizationSettings.fields.shortName')} value={settings.branding.shortName} onChange={(event) => updateGroupField('branding', 'shortName', event.target.value)} />
                  <Input label={t('organizationSettings.fields.supportEmail')} type="email" value={settings.branding.supportEmail} onChange={(event) => updateGroupField('branding', 'supportEmail', event.target.value)} />
                  <Input label={t('organizationSettings.fields.emailSenderName')} value={settings.branding.emailFromName} onChange={(event) => updateGroupField('branding', 'emailFromName', event.target.value)} />
                  <Input label={t('organizationSettings.fields.websiteUrl')} value={settings.branding.websiteUrl} onChange={(event) => updateGroupField('branding', 'websiteUrl', event.target.value)} />
                  <Input label={t('organizationSettings.fields.timezone')} value={settings.timezone} onChange={(event) => updateField('timezone', event.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizationSettings.fields.primaryColor')}</label>
                      <input type="color" value={settings.branding.primaryColor} onChange={(event) => updateGroupField('branding', 'primaryColor', event.target.value)} className="w-full h-11 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizationSettings.fields.secondaryColor')}</label>
                      <input type="color" value={settings.branding.secondaryColor} onChange={(event) => updateGroupField('branding', 'secondaryColor', event.target.value)} className="w-full h-11 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.passwordResetEnabled')}</span>
                    <input type="checkbox" checked={settings.securitySettings.passwordResetEnabled} onChange={(event) => updateGroupField('securitySettings', 'passwordResetEnabled', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.publicAttendance')}</span>
                    <input type="checkbox" checked={settings.attendanceSettings.allowPublicAttendance} onChange={(event) => updateGroupField('attendanceSettings', 'allowPublicAttendance', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.leaveApprovalRequired')}</span>
                    <input type="checkbox" checked={settings.leaveSettings.approvalRequired} onChange={(event) => updateGroupField('leaveSettings', 'approvalRequired', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <Input label={t('organizationSettings.fields.qrValiditySeconds')} type="number" value={settings.attendanceSettings.qrTokenValiditySeconds} onChange={(event) => updateGroupField('attendanceSettings', 'qrTokenValiditySeconds', event.target.value)} />
                  <Input label={t('organizationSettings.fields.defaultAnnualLeave')} type="number" value={settings.leaveSettings.defaultAnnualBalance} onChange={(event) => updateGroupField('leaveSettings', 'defaultAnnualBalance', event.target.value)} />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.departments')}</h2>
                      <p className="text-sm text-gray-500">{t('organizationSettings.sections.departmentsDescription')}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={addDepartment} icon={FaPlus}>{t('organizationSettings.actions.addDepartment')}</Button>
                  </div>

                  <div className="space-y-3">
                    {settings.departments.map((department, index) => (
                      <div key={`${department.code || 'department'}-${index}`} className="rounded-xl border border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input label={t('organizationSettings.fields.code')} value={department.code} onChange={(event) => updateDepartment(index, 'code', normalizeDepartmentCode(event.target.value))} />
                          <Input label={t('organizationSettings.fields.nameEn')} value={department.nameEn} onChange={(event) => updateDepartment(index, 'nameEn', event.target.value)} />
                          <Input label={t('organizationSettings.fields.nameAr')} value={department.nameAr} onChange={(event) => updateDepartment(index, 'nameAr', event.target.value)} />
                          <div className="flex items-end gap-2">
                            <label className="flex-1 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">{t('organizationSettings.toggles.active')}</span>
                              <input type="checkbox" checked={department.isActive} onChange={(event) => updateDepartment(index, 'isActive', event.target.checked)} className="h-4 w-4" />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeDepartment(index)}
                              disabled={settings.departments.length === 1}
                              className="h-11 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <Button type="submit" disabled={saving}>{saving ? t('organizationSettings.actions.saving') : t('organizationSettings.actions.saveSettings')}</Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <FaGlobe className="text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.featureFlags')}</h2>
                  <p className="text-sm text-gray-500">{t('organizationSettings.sections.featureFlagsDescription')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(settings.featureFlags || {}).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{key}</span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {enabled ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <FaUserPlus className="text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.inviteMember')}</h2>
                  <p className="text-sm text-gray-500">{t('organizationSettings.sections.inviteMemberDescription')}</p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
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
                <Button type="submit" disabled={inviteLoading} fullWidth>{inviteLoading ? t('organizationSettings.actions.creatingInvitation') : t('organizationSettings.actions.createInvitation')}</Button>
              </form>

              {latestActivationUrl && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">{t('organizationSettings.fields.activationLink')}</p>
                  <input readOnly value={latestActivationUrl} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm" />
                </div>
              )}
            </Card>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <FaUsers className="text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.sections.invitations')}</h2>
                <p className="text-sm text-gray-500">{t('organizationSettings.sections.invitationsDescription')}</p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={loadData}>{t('organizationSettings.actions.refresh')}</Button>
          </div>

          {invitations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">{t('organizationSettings.states.noInvitations')}</div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id || invitation._id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <FaEnvelope className="text-primary" />
                        <span className="font-medium">{invitation.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {getRoleLabel(invitation.organizationRole || invitation.role, t, i18n.language)}
                        </span>
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {getDepartmentLabel(invitation.department, settings, t, i18n.language)}
                        </span>
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-blue-800">
                          {getInvitationStatusLabel(invitation.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString(activeLocale) : t('organizationSettings.states.notAvailable')}
                      </p>
                    </div>
                    {invitation.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => cancelInvitation(invitation.id || invitation._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
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
    </Layout>
  );
};

export default OrganizationSettings;
