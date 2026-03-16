import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft,
  FaBuilding,
  FaEdit,
  FaGlobe,
  FaLayerGroup,
  FaShieldAlt,
  FaUsers
} from 'react-icons/fa';
import Button from '../components/Common/Button';
import Card from '../components/Common/Card';
import Loading from '../components/Common/Loading';
import PageTitle from '../components/Common/PageTilte';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatDateTime } from '../utils/dateUtils';
import { showError } from '../utils/toast';
import {
  FEATURE_FIELDS,
  LIMIT_FIELDS,
  formatLimitValue,
  formatMoney,
  getPlanName
} from '../components/Platform/planUtils';
import {
  formatLabel,
  getOrganizationId,
  getOrganizationName,
  getStatusClasses
} from '../components/Platform/platformOrganizationUtils';

const DetailItem = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-gray-900">
      {value || '--'}
    </p>
    {helper ? (
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    ) : null}
  </div>
);

const SubscriptionUsageCard = ({ label, metric, locale, t }) => (
  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-2 text-lg font-semibold text-gray-900">
      {metric?.used?.toLocaleString(locale) || 0}
    </p>
    <p className="mt-1 text-sm text-gray-500">
      {`${t('common.limit', { defaultValue: 'Limit' })}: ${formatLimitValue(metric?.limit, t, locale)}`}
    </p>
    <p className="mt-1 text-xs text-gray-400">
      {metric?.remaining === null || metric?.remaining === undefined
        ? t('platformSettings.plan.unlimited')
        : `${t('common.remaining', { defaultValue: 'Remaining' })}: ${Number(metric.remaining).toLocaleString(locale)}`}
    </p>
  </div>
);

const PlatformOrganizationDetails = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? 'ar-EG' : 'en-US';
  const returnTo = location.state?.returnTo || '/users';
  const seededOrganization = (
    location.state?.organization
    && getOrganizationId(location.state.organization) === organizationId
      ? location.state.organization
      : null
  );
  const [organization, setOrganization] = useState(seededOrganization);
  const [loading, setLoading] = useState(!seededOrganization);

  const loadOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/organizations/${organizationId}`);
      setOrganization(response.data?.data || null);
    } catch (error) {
      console.error('Error loading organization details:', error);
      showError(error.response?.data?.message || 'Unable to load organization details.');
      navigate(returnTo, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, organizationId, returnTo]);

  useEffect(() => {
    if (!seededOrganization) {
      loadOrganization();
    }
  }, [loadOrganization, seededOrganization]);

  const getOrganizationStatusLabel = useCallback((status) => (
    t(`organizationSettings.organizationStatus.${status}`, {
      defaultValue: formatLabel(status)
    })
  ), [t]);

  const getSubscriptionStatusLabel = useCallback((status) => (
    t(`organizationSettings.subscription.statuses.${status}`, {
      defaultValue: formatLabel(status)
    })
  ), [t]);

  const getFeatureLabel = useCallback((feature) => (
    t(feature.labelKey, {
      defaultValue: formatLabel(feature.key)
    })
  ), [t]);

  const getLimitLabel = useCallback((limit) => (
    t(limit.labelKey, {
      defaultValue: formatLabel(limit.key)
    })
  ), [t]);

  const getFeatureFlagLabel = useCallback((key) => (
    t(`organizationSettings.featureFlags.${key}`, {
      defaultValue: formatLabel(key)
    })
  ), [t]);

  const organizationPlan = organization?.subscription?.plan || null;
  const subscribedPlan = organization?.subscription?.subscribedPlan || organizationPlan;
  const allowedDomains = Array.isArray(organization?.allowedDomains) ? organization.allowedDomains : [];
  const usageEntries = Object.entries(organization?.subscription?.usage || {});
  const featureFlagsEntries = Object.entries(organization?.featureFlags || {});
  const limitOverrides = organization?.subscriptionConfig?.customLimits || {};
  const departmentEntries = Array.isArray(organization?.departments) ? organization.departments : [];

  const summaryCards = useMemo(() => ([
    {
      label: t('organizationSettings.stats.users'),
      value: organization?.summary?.users || 0,
      helper: t('organizationSettings.stats.active')
    },
    {
      label: t('organizationSettings.stats.active'),
      value: organization?.summary?.activeUsers || 0,
      helper: getOrganizationStatusLabel(organization?.status)
    },
    {
      label: t('organizationSettings.stats.invites'),
      value: organization?.summary?.pendingInvitations || 0,
      helper: t('organizationSettings.sections.invitations', { defaultValue: 'Invitations' })
    },
    {
      label: t('organizationSettings.subscription.currentPlan', { defaultValue: 'Current Plan' }),
      value: getPlanName(organizationPlan, i18n.language),
      helper: t('organizationSettings.subscription.currentPlan', { defaultValue: 'Current Plan' })
    }
  ]), [getOrganizationStatusLabel, i18n.language, organization?.status, organization?.summary, organizationPlan, t]);

  if (loading) {
    return <Loading />;
  }

  if (!organization) {
    return null;
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
                    title={getOrganizationName(organization)}
                    description={`${organization.slug || '--'} - ${getOrganizationStatusLabel(organization.status)}`}
                    titleClass="text-white"
                    descriptionClass="text-white/75"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(organization.status)}`}>
                      {getOrganizationStatusLabel(organization.status)}
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                      {getPlanName(organizationPlan, i18n.language)}
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                      {organization.locale || '--'} / {organization.timezone || '--'}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate(`/platform/organizations/${organizationId}/edit`, {
                  state: {
                    organization,
                    returnTo: location.pathname,
                    detailReturnTo: returnTo
                  }
                })}
                icon={FaEdit}
                className="min-w-[170px]"
              >
                Edit Organization
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {card.helper}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
          <div className="space-y-6">
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
                    Organization identity, branding, and access details.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailItem label="Organization Name" value={organization.name} />
                <DetailItem label="Slug" value={organization.slug} />
                <DetailItem label={t('organizationSettings.fields.displayName')} value={organization.branding?.displayName} />
                <DetailItem label={t('organizationSettings.fields.shortName')} value={organization.branding?.shortName} />
                <DetailItem label={t('organizationSettings.fields.emailSenderName')} value={organization.branding?.emailFromName} />
                <DetailItem label={t('organizationSettings.fields.supportEmail')} value={organization.branding?.supportEmail} />
                <DetailItem label={t('organizationSettings.fields.websiteUrl')} value={organization.branding?.websiteUrl} />
                <DetailItem label={t('organizationSettings.fields.timezone')} value={`${organization.locale || '--'} / ${organization.timezone || '--'}`} />
              </div>

              <div className="mt-6 rounded-3xl border border-dashed border-gray-300 px-5 py-5">
                <p className="text-sm font-semibold text-gray-900">
                  {t('organizationSettings.fields.allowedDomains')}
                </p>
                {allowedDomains.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No domain restrictions configured.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allowedDomains.map((domain) => (
                      <span key={domain} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {domain}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

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
                    Security, attendance, and leave rules for this organization.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailItem
                  label={t('organizationSettings.toggles.passwordResetEnabled')}
                  value={organization.securitySettings?.passwordResetEnabled !== false ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                />
                <DetailItem
                  label="Require Domain Match"
                  value={organization.securitySettings?.requireDomainMatch ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                />
                <DetailItem
                  label={t('organizationSettings.toggles.publicAttendance')}
                  value={organization.attendanceSettings?.allowPublicAttendance !== false ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                />
                <DetailItem
                  label={t('organizationSettings.fields.qrValiditySeconds')}
                  value={organization.attendanceSettings?.qrTokenValiditySeconds}
                />
                <DetailItem
                  label={t('organizationSettings.toggles.leaveApprovalRequired')}
                  value={organization.leaveSettings?.approvalRequired !== false ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                />
                <DetailItem
                  label={t('organizationSettings.fields.defaultAnnualLeave')}
                  value={organization.leaveSettings?.defaultAnnualBalance}
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
                    Department structure and current organization capacity.
                  </p>
                </div>
              </div>

              {departmentEntries.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No departments configured for this organization yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {departmentEntries.map((department, index) => (
                    <div key={`${department.code || 'department'}-${index}`} className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {department.name?.[i18n.language] || department.name?.en || department.code}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                            {department.code || '--'}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${department.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {department.isActive !== false ? t('users.active') : t('users.inactive')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
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
                    Current plan, lifecycle status, and subscription dates.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <DetailItem
                  label={t('organizationSettings.subscription.currentPlan', { defaultValue: 'Current Plan' })}
                  value={getPlanName(organizationPlan, i18n.language)}
                  helper={organization?.subscription?.isDowngraded ? `Subscribed: ${getPlanName(subscribedPlan, i18n.language)}` : null}
                />
                <DetailItem
                  label="Subscription Status"
                  value={getSubscriptionStatusLabel(organization?.subscription?.rawStatus || organization?.subscription?.status)}
                  helper={organization?.subscription?.isDowngraded ? 'Downgrade enforcement is active.' : null}
                />
                <DetailItem
                  label="Billing Cycle"
                  value={formatLabel(organization?.subscriptionConfig?.billingCycle || 'monthly')}
                />
                <DetailItem
                  label="Downgrade Plan"
                  value={formatLabel(organization?.subscription?.downgradePlanCode)}
                />
                <DetailItem
                  label="Started At"
                  value={formatDateTime(organization?.subscription?.startedAt, i18n.language)}
                />
                <DetailItem
                  label="Ends At"
                  value={formatDateTime(organization?.subscription?.endsAt, i18n.language)}
                />
                <DetailItem
                  label="Grace Ends At"
                  value={formatDateTime(organization?.subscription?.graceEndsAt, i18n.language)}
                />
                <DetailItem
                  label="Notes"
                  value={organization?.subscriptionConfig?.notes}
                />
              </div>

              {organizationPlan ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t('platformSettings.plan.monthly')}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                      {formatMoney(organizationPlan.pricing?.monthly?.amount, organizationPlan.market?.currency, locale)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t('platformSettings.plan.yearly')}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                      {formatMoney(organizationPlan.pricing?.yearly?.amount, organizationPlan.market?.currency, locale)}
                    </p>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="rounded-3xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FaGlobe className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('platformSettings.plan.limitsTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Effective limits for the active subscription, with override indicators when applicable.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {LIMIT_FIELDS.map((limit) => {
                  const limitValue = organization?.subscription?.entitlements?.limits?.[limit.key];
                  const hasOverride = Object.prototype.hasOwnProperty.call(limitOverrides, limit.key);

                  return (
                    <div key={limit.key} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{getLimitLabel(limit)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {hasOverride ? 'Custom override applied.' : 'Using the assigned plan default.'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatLimitValue(limitValue, t, locale)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {usageEntries.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {usageEntries.map(([key, metric]) => (
                    <SubscriptionUsageCard
                      key={key}
                      label={getLimitLabel({ key, labelKey: `organizationSettings.subscription.metrics.${key}` })}
                      metric={metric}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
              ) : null}
            </Card>

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
                    Plan entitlements and organization-specific feature switches.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {FEATURE_FIELDS.map((feature) => {
                  const enabled = Boolean(organization?.subscription?.entitlements?.features?.[feature.key]);
                  const lockedByFlag = organization?.featureFlags?.[feature.key] === false;

                  return (
                    <div key={feature.key} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{getFeatureLabel(feature)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {lockedByFlag ? 'Disabled by organization feature flag.' : 'Available through the subscription.'}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {enabled ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {featureFlagsEntries.length > 0 ? (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <p className="text-sm font-semibold text-gray-900">Organization feature flags</p>
                  <div className="mt-4 grid gap-3">
                    {featureFlagsEntries.map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                        <span className="text-sm font-medium text-gray-900">{getFeatureFlagLabel(key)}</span>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {enabled ? t('organizationSettings.states.enabled') : t('organizationSettings.states.disabled')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlatformOrganizationDetails;
