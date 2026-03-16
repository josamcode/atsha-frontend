import { getDateInputValue } from '../../utils/dateUtils';
import { LIMIT_FIELDS } from './planUtils';

export const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];
export const SUBSCRIPTION_STATUS_OPTIONS = ['trialing', 'active', 'past_due', 'expired', 'cancelled', 'suspended'];
export const BILLING_CYCLE_OPTIONS = ['monthly', 'quarterly', 'semiannual', 'annual', 'custom'];

export const buildDepartmentDraft = (index = 0) => ({
  code: '',
  nameEn: '',
  nameAr: '',
  isActive: true,
  sortOrder: index
});

export const normalizeDepartmentCode = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getOrganizationId = (organization) => organization?._id || organization?.id || '';

export const getOrganizationName = (organization) => (
  organization?.branding?.displayName
  || organization?.name
  || '--'
);

export const getOrganizationPlanCode = (organization) => (
  organization?.subscription?.effectivePlanCode
  || organization?.subscription?.subscribedPlanCode
  || organization?.subscription?.plan?.code
  || organization?.subscriptionConfig?.planCode
  || organization?.plan
  || 'free'
);

export const formatLabel = (value) => {
  const normalizedValue = String(value || '').replace(/[_-]+/g, ' ').trim();
  if (!normalizedValue) {
    return '--';
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
};

export const getStatusClasses = (status) => {
  if (status === 'active') {
    return 'border border-green-200 bg-green-50 text-green-700';
  }

  if (status === 'suspended') {
    return 'border border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border border-gray-200 bg-gray-50 text-gray-600';
};

export const buildOrganizationForm = (organization = null) => ({
  name: organization?.name || '',
  slug: organization?.slug || '',
  status: organization?.status || 'active',
  locale: organization?.locale || 'en',
  timezone: organization?.timezone || 'Africa/Cairo',
  allowedDomainsText: Array.isArray(organization?.allowedDomains)
    ? organization.allowedDomains.join('\n')
    : '',
  branding: {
    displayName: organization?.branding?.displayName || '',
    shortName: organization?.branding?.shortName || '',
    supportEmail: organization?.branding?.supportEmail || '',
    emailFromName: organization?.branding?.emailFromName || '',
    websiteUrl: organization?.branding?.websiteUrl || ''
  },
  securitySettings: {
    requireDomainMatch: organization?.securitySettings?.requireDomainMatch === true,
    passwordResetEnabled: organization?.securitySettings?.passwordResetEnabled !== false
  },
  attendanceSettings: {
    qrTokenValiditySeconds: organization?.attendanceSettings?.qrTokenValiditySeconds || 30,
    allowPublicAttendance: organization?.attendanceSettings?.allowPublicAttendance !== false
  },
  leaveSettings: {
    approvalRequired: organization?.leaveSettings?.approvalRequired !== false,
    defaultAnnualBalance: organization?.leaveSettings?.defaultAnnualBalance || 0
  },
  featureFlags: {
    ...(organization?.featureFlags || {})
  },
  departments: Array.isArray(organization?.departments) && organization.departments.length > 0
    ? organization.departments.map((department, index) => ({
      code: department.code || '',
      nameEn: department.name?.en || '',
      nameAr: department.name?.ar || '',
      isActive: department.isActive !== false,
      sortOrder: department.sortOrder ?? index
    }))
    : [buildDepartmentDraft()],
  subscription: {
    planCode: organization?.subscriptionConfig?.planCode
      || organization?.subscription?.subscribedPlanCode
      || getOrganizationPlanCode(organization),
    status: organization?.subscriptionConfig?.status
      || organization?.subscription?.rawStatus
      || organization?.subscription?.status
      || 'active',
    billingCycle: organization?.subscriptionConfig?.billingCycle || 'monthly',
    downgradePlanCode: organization?.subscriptionConfig?.downgradePlanCode
      || organization?.subscription?.downgradePlanCode
      || 'free',
    startsAt: getDateInputValue(
      organization?.subscriptionConfig?.startsAt
      || organization?.subscription?.startedAt
    ),
    endsAt: getDateInputValue(
      organization?.subscriptionConfig?.endsAt
      || organization?.subscription?.endsAt
    ),
    graceEndsAt: getDateInputValue(
      organization?.subscriptionConfig?.graceEndsAt
      || organization?.subscription?.graceEndsAt
    ),
    notes: organization?.subscriptionConfig?.notes || '',
    customLimits: LIMIT_FIELDS.reduce((result, entry) => ({
      ...result,
      [entry.key]: organization?.subscriptionConfig?.customLimits?.[entry.key] ?? ''
    }), {})
  }
});

export const buildOrganizationPayload = (formData) => {
  const customLimits = LIMIT_FIELDS.reduce((result, entry) => {
    const rawValue = formData.subscription?.customLimits?.[entry.key];

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return result;
    }

    const normalizedValue = Number(rawValue);
    result[entry.key] = Number.isFinite(normalizedValue) && normalizedValue >= 0
      ? normalizedValue
      : 0;
    return result;
  }, {});

  return {
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    status: formData.status,
    locale: formData.locale,
    timezone: formData.timezone,
    allowedDomains: String(formData.allowedDomainsText || '')
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean),
    branding: {
      displayName: formData.branding.displayName,
      shortName: formData.branding.shortName,
      emailFromName: formData.branding.emailFromName,
      websiteUrl: formData.branding.websiteUrl
    },
    securitySettings: {
      requireDomainMatch: formData.securitySettings.requireDomainMatch === true,
      passwordResetEnabled: formData.securitySettings.passwordResetEnabled !== false
    },
    attendanceSettings: {
      allowPublicAttendance: formData.attendanceSettings.allowPublicAttendance !== false,
      qrTokenValiditySeconds: Number(formData.attendanceSettings.qrTokenValiditySeconds) || 30
    },
    leaveSettings: {
      approvalRequired: formData.leaveSettings.approvalRequired !== false,
      defaultAnnualBalance: Number(formData.leaveSettings.defaultAnnualBalance) || 0
    },
    featureFlags: {
      ...(formData.featureFlags || {})
    },
    departments: (formData.departments || [])
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
      .filter((department) => department.code),
    subscription: {
      planCode: formData.subscription.planCode,
      status: formData.subscription.status,
      billingCycle: formData.subscription.billingCycle,
      downgradePlanCode: formData.subscription.downgradePlanCode,
      startsAt: formData.subscription.startsAt || null,
      endsAt: formData.subscription.endsAt || null,
      graceEndsAt: formData.subscription.graceEndsAt || null,
      notes: formData.subscription.notes,
      customLimits
    }
  };
};
