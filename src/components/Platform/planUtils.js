export const FEATURE_FIELDS = [
  { key: 'qrCode', labelKey: 'platformSettings.features.qrCode' },
  { key: 'attendanceManagement', labelKey: 'platformSettings.features.attendanceManagement' },
  { key: 'leaveManagement', labelKey: 'platformSettings.features.leaveManagement' },
  { key: 'messaging', labelKey: 'platformSettings.features.messaging' }
];

export const LIMIT_FIELDS = [
  { key: 'usersTotal', labelKey: 'platformSettings.limits.usersTotal' },
  { key: 'templatesTotal', labelKey: 'platformSettings.limits.templatesTotal' },
  { key: 'formsPerMonth', labelKey: 'platformSettings.limits.formsPerMonth' },
  { key: 'messagesPerMonth', labelKey: 'platformSettings.limits.messagesPerMonth' }
];

export const buildPlanForm = (plan = null) => ({
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

export const getPlanName = (plan, language = 'en') => (
  plan?.name?.[language]
  || plan?.name?.en
  || String(plan?.code || '').toUpperCase()
);

export const getPlanDescription = (plan, language = 'en') => (
  plan?.description?.[language]
  || plan?.description?.en
  || ''
);

export const formatMoney = (amount, currency = 'SAR', locale = 'en-US') => {
  const normalizedAmount = Number(amount) || 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: String(currency || 'SAR').toUpperCase(),
      maximumFractionDigits: normalizedAmount % 1 === 0 ? 0 : 2
    }).format(normalizedAmount);
  } catch (error) {
    return `${normalizedAmount} ${currency || 'SAR'}`;
  }
};

export const formatLimitValue = (value, t, locale = 'en-US') => {
  if (value === null || value === undefined || value === '') {
    return t('platformSettings.plan.unlimited');
  }

  return Number(value).toLocaleString(locale);
};
