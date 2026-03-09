import React, { useEffect, useState } from 'react';
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

  const loadData = async () => {
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
      showError(error.response?.data?.message || 'Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      showSuccess('Organization settings updated');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update organization settings');
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
      showSuccess('Invitation created');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create invitation');
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
      showSuccess('Invitation cancelled');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  if (loading || !settings) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <FaBuilding className="text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{settings.branding.displayName || settings.name}</h1>
                <p className="text-sm text-white/80 mt-1">{settings.slug} • {settings.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-[18rem]">
              <div className="rounded-xl bg-white/15 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">Users</p>
                <p className="text-2xl font-semibold">{settings.summary.users || 0}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">Active</p>
                <p className="text-2xl font-semibold">{settings.summary.activeUsers || 0}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">Invites</p>
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
                  <Input label="Display Name" value={settings.branding.displayName} onChange={(event) => updateGroupField('branding', 'displayName', event.target.value)} />
                  <Input label="Short Name" value={settings.branding.shortName} onChange={(event) => updateGroupField('branding', 'shortName', event.target.value)} />
                  <Input label="Support Email" type="email" value={settings.branding.supportEmail} onChange={(event) => updateGroupField('branding', 'supportEmail', event.target.value)} />
                  <Input label="Email Sender Name" value={settings.branding.emailFromName} onChange={(event) => updateGroupField('branding', 'emailFromName', event.target.value)} />
                  <Input label="Website URL" value={settings.branding.websiteUrl} onChange={(event) => updateGroupField('branding', 'websiteUrl', event.target.value)} />
                  <Input label="Timezone" value={settings.timezone} onChange={(event) => updateField('timezone', event.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Locale</label>
                    <select
                      value={settings.locale}
                      onChange={(event) => updateField('locale', event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                      <input type="color" value={settings.branding.primaryColor} onChange={(event) => updateGroupField('branding', 'primaryColor', event.target.value)} className="w-full h-11 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                      <input type="color" value={settings.branding.secondaryColor} onChange={(event) => updateGroupField('branding', 'secondaryColor', event.target.value)} className="w-full h-11 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Domains</label>
                  <textarea
                    rows={4}
                    value={settings.allowedDomainsText}
                    onChange={(event) => updateField('allowedDomainsText', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="portal.example.com&#10;staff.example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Require Domain Match</span>
                    <input type="checkbox" checked={settings.securitySettings.requireDomainMatch} onChange={(event) => updateGroupField('securitySettings', 'requireDomainMatch', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Password Reset Enabled</span>
                    <input type="checkbox" checked={settings.securitySettings.passwordResetEnabled} onChange={(event) => updateGroupField('securitySettings', 'passwordResetEnabled', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Public Attendance</span>
                    <input type="checkbox" checked={settings.attendanceSettings.allowPublicAttendance} onChange={(event) => updateGroupField('attendanceSettings', 'allowPublicAttendance', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Leave Approval Required</span>
                    <input type="checkbox" checked={settings.leaveSettings.approvalRequired} onChange={(event) => updateGroupField('leaveSettings', 'approvalRequired', event.target.checked)} className="h-4 w-4" />
                  </label>
                  <Input label="QR Validity (seconds)" type="number" value={settings.attendanceSettings.qrTokenValiditySeconds} onChange={(event) => updateGroupField('attendanceSettings', 'qrTokenValiditySeconds', event.target.value)} />
                  <Input label="Default Annual Leave" type="number" value={settings.leaveSettings.defaultAnnualBalance} onChange={(event) => updateGroupField('leaveSettings', 'defaultAnnualBalance', event.target.value)} />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
                      <p className="text-sm text-gray-500">Organization-managed department codes.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={addDepartment} icon={FaPlus}>Add</Button>
                  </div>

                  <div className="space-y-3">
                    {settings.departments.map((department, index) => (
                      <div key={`${department.code || 'department'}-${index}`} className="rounded-xl border border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input label="Code" value={department.code} onChange={(event) => updateDepartment(index, 'code', normalizeDepartmentCode(event.target.value))} />
                          <Input label="Name (EN)" value={department.nameEn} onChange={(event) => updateDepartment(index, 'nameEn', event.target.value)} />
                          <Input label="Name (AR)" value={department.nameAr} onChange={(event) => updateDepartment(index, 'nameAr', event.target.value)} />
                          <div className="flex items-end gap-2">
                            <label className="flex-1 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">Active</span>
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

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <FaGlobe className="text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
                  <p className="text-sm text-gray-500">Current organization capabilities.</p>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(settings.featureFlags || {}).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{key}</span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <FaUserPlus className="text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Invite Member</h2>
                  <p className="text-sm text-gray-500">Create onboarding links for new organization users.</p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <Input label="Email" type="email" value={inviteForm.email} onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, email: event.target.value }))} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={inviteForm.languagePreference}
                      onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, languagePreference: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                  <Input label="Expires in Days" type="number" value={inviteForm.expiresInDays} onChange={(event) => setInviteForm((currentValue) => ({ ...currentValue, expiresInDays: event.target.value }))} />
                </div>
                <Button type="submit" disabled={inviteLoading} fullWidth>{inviteLoading ? 'Creating...' : 'Create Invitation'}</Button>
              </form>

              {latestActivationUrl && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Activation Link</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Invitations</h2>
                <p className="text-sm text-gray-500">Organization-scoped invitation history.</p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={loadData}>Refresh</Button>
          </div>

          {invitations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">No invitations yet.</div>
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
                          {invitation.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : '--'}
                      </p>
                    </div>
                    {invitation.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => cancelInvitation(invitation.id || invitation._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FaTimes />
                        Cancel
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
