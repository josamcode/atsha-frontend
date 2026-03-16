import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft,
  FaBuilding,
  FaGlobe,
  FaLayerGroup,
  FaPlus,
  FaShieldAlt,
  FaTimes,
  FaUsers
} from 'react-icons/fa';
import Button from '../components/Common/Button';
import Card from '../components/Common/Card';
import Input from '../components/Common/Input';
import Loading from '../components/Common/Loading';
import PageTitle from '../components/Common/PageTilte';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';
import {
  LIMIT_FIELDS,
  formatLimitValue,
  getPlanDescription,
  getPlanName
} from '../components/Platform/planUtils';
import {
  BILLING_CYCLE_OPTIONS,
  STATUS_OPTIONS,
  SUBSCRIPTION_STATUS_OPTIONS,
  buildDepartmentDraft,
  buildOrganizationForm,
  buildOrganizationPayload,
  formatLabel,
  getOrganizationId,
  getOrganizationName,
  normalizeDepartmentCode
} from '../components/Platform/platformOrganizationUtils';

const PlatformOrganizationEditor = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? 'ar-EG' : 'en-US';
  const fallbackReturnTo = `/platform/organizations/${organizationId}`;
  const returnTo = location.state?.returnTo || fallbackReturnTo;
  const seededOrganization = (
    location.state?.organization
    && getOrganizationId(location.state.organization) === organizationId
      ? location.state.organization
      : null
  );
  const [organization, setOrganization] = useState(seededOrganization);
  const [formData, setFormData] = useState(() => buildOrganizationForm(seededOrganization));
  const [planOptions, setPlanOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEditorData = useCallback(async () => {
    try {
      setLoading(true);
      const [organizationResponse, plansResponse] = await Promise.all([
        api.get(`/organizations/${organizationId}`),
        api.get('/platform/plans', {
          params: {
            includeInactive: true
          }
        })
      ]);

      const nextOrganization = organizationResponse.data?.data || null;
      setOrganization(nextOrganization);
      setFormData(buildOrganizationForm(nextOrganization));
      setPlanOptions(Array.isArray(plansResponse.data?.data) ? plansResponse.data.data : []);
    } catch (error) {
      console.error('Error loading organization editor:', error);
      showError(error.response?.data?.message || 'Unable to load organization editor.');
      navigate(returnTo, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, organizationId, returnTo]);

  useEffect(() => {
    loadEditorData();
  }, [loadEditorData]);

  const planLookup = useMemo(() => planOptions.reduce((result, plan) => {
    result[plan.code] = plan;
    return result;
  }, {}), [planOptions]);

  const selectedPlan = planLookup[formData.subscription.planCode] || null;
  const featureFlagsEntries = Object.entries(formData.featureFlags || {});

  const getOrganizationStatusLabel = useCallback((status) => (
    t(`organizationSettings.organizationStatus.${status}`, {
      defaultValue: formatLabel(status)
    })
  ), [t]);

  const getFeatureFlagLabel = useCallback((key) => (
    t(`organizationSettings.featureFlags.${key}`, {
      defaultValue: formatLabel(key)
    })
  ), [t]);

  const getLimitLabel = useCallback((limit) => (
    t(limit.labelKey, {
      defaultValue: formatLabel(limit.key)
    })
  ), [t]);

  const getSubscriptionStatusLabel = useCallback((status) => (
    t(`organizationSettings.subscription.statuses.${status}`, {
      defaultValue: formatLabel(status)
    })
  ), [t]);

  const updateField = (field, value) => {
    setFormData((currentValue) => ({
      ...currentValue,
      [field]: value
    }));
  };

  const updateGroupField = (group, field, value) => {
    setFormData((currentValue) => ({
      ...currentValue,
      [group]: {
        ...(currentValue[group] || {}),
        [field]: value
      }
    }));
  };

  const updateSubscriptionField = (field, value) => {
    setFormData((currentValue) => ({
      ...currentValue,
      subscription: {
        ...(currentValue.subscription || {}),
        [field]: value
      }
    }));
  };

  const updateSubscriptionLimit = (limitKey, value) => {
    setFormData((currentValue) => ({
      ...currentValue,
      subscription: {
        ...(currentValue.subscription || {}),
        customLimits: {
          ...(currentValue.subscription?.customLimits || {}),
          [limitKey]: value
        }
      }
    }));
  };

  const updateDepartment = (index, field, value) => {
    setFormData((currentValue) => ({
      ...currentValue,
      departments: currentValue.departments.map((department, departmentIndex) => (
        departmentIndex === index ? { ...department, [field]: value } : department
      ))
    }));
  };

  const addDepartment = () => {
    setFormData((currentValue) => ({
      ...currentValue,
      departments: [...currentValue.departments, buildDepartmentDraft(currentValue.departments.length)]
    }));
  };

  const removeDepartment = (index) => {
    setFormData((currentValue) => ({
      ...currentValue,
      departments: currentValue.departments.filter((_, departmentIndex) => departmentIndex !== index)
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildOrganizationPayload(formData);
      const response = await api.put(`/organizations/${organizationId}`, payload);
      const nextOrganization = response.data?.data || null;

      setOrganization(nextOrganization);
      setFormData(buildOrganizationForm(nextOrganization));
      showSuccess('Organization updated successfully.');
      navigate(fallbackReturnTo, {
        replace: true,
        state: {
          organization: nextOrganization,
          returnTo: location.state?.detailReturnTo || '/users'
        }
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      showError(error.response?.data?.message || 'Unable to update organization.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-primary shadow-[0_30px_100px_-45px_rgba(15,23,42,0.65)]">
          <div className="px-6 py-7 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-white shadow-lg backdrop-blur-sm">
                  <FaBuilding className="text-2xl" />
                </div>

                <div className="min-w-0 flex-1">
                  <Button
                    variant="outline"
                    onClick={() => navigate(returnTo)}
                    icon={FaArrowLeft}
                    className="mb-4 border-white/20 text-white hover:border-white hover:bg-white hover:text-slate-900"
                  >
                    {t('common.back')}
                  </Button>

                  <PageTitle
                    title="Edit Organization"
                    description={getOrganizationName(organization)}
                    titleClass="text-white"
                    descriptionClass="text-white/75"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                      {formData.slug || '--'}
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                      {getOrganizationStatusLabel(formData.status)}
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                      {getPlanName(selectedPlan || { code: formData.subscription.planCode }, i18n.language)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[420px]">
                <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                    {t('organizationSettings.stats.users')}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    {organization?.summary?.users || 0}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                    {t('organizationSettings.stats.active')}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    {organization?.summary?.activeUsers || 0}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                    {t('platformSettings.plan.limitsTitle')}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    {LIMIT_FIELDS.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FaBuilding className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t('organizationSettings.tabs.general')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Edit organization identity, branding, locale, and domain settings.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Organization Name"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('common.status')}
                </label>
                <select
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getOrganizationStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('organizationSettings.fields.locale')}
                </label>
                <select
                  value={formData.locale}
                  onChange={(event) => updateField('locale', event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="en">{t('organizationSettings.languageOptions.en')}</option>
                  <option value="ar">{t('organizationSettings.languageOptions.ar')}</option>
                </select>
              </div>

              <Input
                label={t('organizationSettings.fields.timezone')}
                value={formData.timezone}
                onChange={(event) => updateField('timezone', event.target.value)}
              />
              <Input
                label={t('organizationSettings.fields.displayName')}
                value={formData.branding.displayName}
                onChange={(event) => updateGroupField('branding', 'displayName', event.target.value)}
              />
              <Input
                label={t('organizationSettings.fields.shortName')}
                value={formData.branding.shortName}
                onChange={(event) => updateGroupField('branding', 'shortName', event.target.value)}
              />
              <Input
                label={t('organizationSettings.fields.supportEmail')}
                value={formData.branding.supportEmail}
                disabled
              />
              <Input
                label={t('organizationSettings.fields.emailSenderName')}
                value={formData.branding.emailFromName}
                onChange={(event) => updateGroupField('branding', 'emailFromName', event.target.value)}
              />
              <Input
                label={t('organizationSettings.fields.websiteUrl')}
                value={formData.branding.websiteUrl}
                onChange={(event) => updateGroupField('branding', 'websiteUrl', event.target.value)}
                icon={FaGlobe}
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('organizationSettings.fields.allowedDomains')}
              </label>
              <textarea
                value={formData.allowedDomainsText}
                onChange={(event) => updateField('allowedDomainsText', event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="example.com"
              />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FaShieldAlt className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('organizationSettings.tabs.policies', { defaultValue: 'Policies' })}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage password, attendance, and leave rules.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {t('organizationSettings.toggles.passwordResetEnabled')}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.securitySettings.passwordResetEnabled}
                    onChange={(event) => updateGroupField('securitySettings', 'passwordResetEnabled', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    Require Domain Match
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.securitySettings.requireDomainMatch}
                    onChange={(event) => updateGroupField('securitySettings', 'requireDomainMatch', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {t('organizationSettings.toggles.publicAttendance')}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.attendanceSettings.allowPublicAttendance}
                    onChange={(event) => updateGroupField('attendanceSettings', 'allowPublicAttendance', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {t('organizationSettings.toggles.leaveApprovalRequired')}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.leaveSettings.approvalRequired}
                    onChange={(event) => updateGroupField('leaveSettings', 'approvalRequired', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <Input
                  label={t('organizationSettings.fields.qrValiditySeconds')}
                  type="number"
                  value={formData.attendanceSettings.qrTokenValiditySeconds}
                  onChange={(event) => updateGroupField('attendanceSettings', 'qrTokenValiditySeconds', event.target.value)}
                />
                <Input
                  label={t('organizationSettings.fields.defaultAnnualLeave')}
                  type="number"
                  value={formData.leaveSettings.defaultAnnualBalance}
                  onChange={(event) => updateGroupField('leaveSettings', 'defaultAnnualBalance', event.target.value)}
                />
              </div>
            </Card>

            <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FaUsers className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('organizationSettings.sections.departments', { defaultValue: 'Departments' })}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Update department names, order, and activity state.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {formData.departments.map((department, index) => (
                  <div key={`${department.code || 'department'}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label={t('organizationSettings.fields.code')}
                        value={department.code}
                        onChange={(event) => updateDepartment(index, 'code', normalizeDepartmentCode(event.target.value))}
                      />
                      <Input
                        label={t('organizationSettings.fields.nameEn')}
                        value={department.nameEn}
                        onChange={(event) => updateDepartment(index, 'nameEn', event.target.value)}
                      />
                      <Input
                        label={t('organizationSettings.fields.nameAr')}
                        value={department.nameAr}
                        onChange={(event) => updateDepartment(index, 'nameAr', event.target.value)}
                      />

                      <div className="flex items-end gap-3">
                        <label className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {t('organizationSettings.toggles.active')}
                          </span>
                          <input
                            type="checkbox"
                            checked={department.isActive}
                            onChange={(event) => updateDepartment(index, 'isActive', event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeDepartment(index)}
                          disabled={formData.departments.length === 1}
                          icon={FaTimes}
                          className="border-gray-300 text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button type="button" variant="outline" onClick={addDepartment} icon={FaPlus}>
                  {t('organizationSettings.actions.addDepartment')}
                </Button>
              </div>
            </Card>
          </div>

          {featureFlagsEntries.length > 0 ? (
            <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FaShieldAlt className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('organizationSettings.sections.featureFlags', { defaultValue: 'Feature Flags' })}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Override organization-level feature switches.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {featureFlagsEntries.map(([key, enabled]) => (
                  <label key={key} className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {getFeatureFlagLabel(key)}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(enabled)}
                      onChange={(event) => setFormData((currentValue) => ({
                        ...currentValue,
                        featureFlags: {
                          ...(currentValue.featureFlags || {}),
                          [key]: event.target.checked
                        }
                      }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
            <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FaLayerGroup className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('organizationSettings.sections.subscription', { defaultValue: 'Subscription' })}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Assign the plan and update subscription lifecycle data.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('organizationSettings.subscription.currentPlan', { defaultValue: 'Current Plan' })}
                  </label>
                  <select
                    value={formData.subscription.planCode}
                    onChange={(event) => updateSubscriptionField('planCode', event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {getPlanName(plan, i18n.language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Subscription Status
                  </label>
                  <select
                    value={formData.subscription.status}
                    onChange={(event) => updateSubscriptionField('status', event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {getSubscriptionStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.subscription.billingCycle}
                    onChange={(event) => updateSubscriptionField('billingCycle', event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {BILLING_CYCLE_OPTIONS.map((cycle) => (
                      <option key={cycle} value={cycle}>
                        {formatLabel(cycle)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Downgrade Plan
                  </label>
                  <select
                    value={formData.subscription.downgradePlanCode}
                    onChange={(event) => updateSubscriptionField('downgradePlanCode', event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {getPlanName(plan, i18n.language)}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Start Date"
                  type="date"
                  value={formData.subscription.startsAt}
                  onChange={(event) => updateSubscriptionField('startsAt', event.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.subscription.endsAt}
                  onChange={(event) => updateSubscriptionField('endsAt', event.target.value)}
                />
                <Input
                  label="Grace End Date"
                  type="date"
                  value={formData.subscription.graceEndsAt}
                  onChange={(event) => updateSubscriptionField('graceEndsAt', event.target.value)}
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.subscription.notes}
                  onChange={(event) => updateSubscriptionField('notes', event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </Card>

            <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FaLayerGroup className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('platformSettings.plan.limitsTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Leave a field blank to inherit the selected plan limit.
                  </p>
                </div>
              </div>

              {selectedPlan ? (
                <div className="mt-6 rounded-3xl border border-primary/10 bg-primary/5 px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {getPlanName(selectedPlan, i18n.language)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {getPlanDescription(selectedPlan, i18n.language) || 'No plan description available.'}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                {LIMIT_FIELDS.map((limit) => (
                  <div key={limit.key}>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {getLimitLabel(limit)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.subscription.customLimits[limit.key]}
                      onChange={(event) => updateSubscriptionLimit(limit.key, event.target.value)}
                      placeholder={formatLimitValue(selectedPlan?.limits?.[limit.key], t, locale)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {`Plan default: ${formatLimitValue(selectedPlan?.limits?.[limit.key], t, locale)}`}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm text-slate-500">
              Changes will update the organization profile, subscription, and custom limit overrides.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(returnTo)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PlatformOrganizationEditor;
