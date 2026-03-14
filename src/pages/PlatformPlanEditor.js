import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEdit,
  FaGlobe,
  FaLayerGroup,
  FaPlus
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
  FEATURE_FIELDS,
  LIMIT_FIELDS,
  buildPlanForm,
  formatMoney
} from '../components/Platform/planUtils';

const PlatformPlanEditor = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { planCode: rawPlanCode } = useParams();
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const isRTL = i18n.language === 'ar';
  const planCode = decodeURIComponent(rawPlanCode || '');
  const isEditMode = Boolean(planCode);
  const seededPlan = (
    location.state?.plan
    && location.state.plan.code === planCode
      ? location.state.plan
      : null
  );
  const returnTo = location.state?.returnTo || '/organization?tab=plans';
  const [loading, setLoading] = useState(isEditMode && !seededPlan);
  const [planSaving, setPlanSaving] = useState(false);
  const [planForm, setPlanForm] = useState(() => buildPlanForm(seededPlan));

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

  const enabledFeaturesCount = useMemo(() => (
    FEATURE_FIELDS.filter((feature) => Boolean(planForm.features?.[feature.key])).length
  ), [planForm.features]);

  useEffect(() => {
    let isMounted = true;

    if (!isEditMode) {
      setPlanForm(buildPlanForm());
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadPlan = async () => {
      if (!seededPlan) {
        setLoading(true);
      }

      try {
        const response = await api.get('/platform/plans', {
          params: {
            includeInactive: true
          }
        });
        const plans = Array.isArray(response.data?.data) ? response.data.data : [];
        const targetPlan = plans.find((plan) => plan.code === planCode);

        if (!targetPlan) {
          showError(t('platformSettings.feedback.loadError'));
          navigate(returnTo, { replace: true });
          return;
        }

        if (isMounted) {
          setPlanForm(buildPlanForm(targetPlan));
        }
      } catch (error) {
        console.error('Error loading platform plan:', error);

        if (!seededPlan) {
          showError(error.response?.data?.message || t('platformSettings.feedback.loadError'));
          navigate(returnTo, { replace: true });
          return;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPlan();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, navigate, planCode, seededPlan, returnTo, t]);

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

      if (isEditMode) {
        await api.put(`/platform/plans/${planCode}`, payload);
        showSuccess(t('platformSettings.feedback.updatePlanSuccess'));
      } else {
        await api.post('/platform/plans', payload);
        showSuccess(t('platformSettings.feedback.createPlanSuccess'));
      }

      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error('Error saving plan:', error);
      showError(error.response?.data?.message || t('platformSettings.feedback.savePlanError'));
    } finally {
      setPlanSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-primary shadow-[0_30px_100px_-45px_rgba(15,23,42,0.65)]">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-7 md:px-8">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-white shadow-lg backdrop-blur-sm">
                <FaLayerGroup className="text-2xl" />
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
                  title={isEditMode ? t('platformSettings.planModal.editTitle') : t('platformSettings.planModal.addTitle')}
                  description={planForm.code || t('platformSettings.plan.description')}
                  titleClass="text-white"
                  descriptionClass="text-white/75"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${planForm.isActive
                    ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30'
                    : 'bg-white/10 text-white/80 ring-white/15'
                    }`}>
                    {planForm.isActive ? t('users.active') : t('users.inactive')}
                  </span>
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-inset ring-white/15">
                    {planForm.currency || 'SAR'}
                  </span>
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-inset ring-white/15">
                    {planForm.primaryRegion || 'MENA'} / {planForm.primaryCountry || 'SA'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[420px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  {t('platformSettings.plan.monthly')}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {formatMoney(planForm.monthlyAmount, planForm.currency, locale)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  {t('platformSettings.plan.yearly')}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {formatMoney(planForm.yearlyAmount, planForm.currency, locale)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  {t('platformSettings.plan.featuresTitle')}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {enabledFeaturesCount}/{FEATURE_FIELDS.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handlePlanSave} className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditMode ? t('platformSettings.actions.editPlan') : t('platformSettings.actions.addPlan')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('platformSettings.plan.description')}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{t('platformSettings.planModal.fields.code')}:</span>{' '}
                {planForm.code || '--'}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label={t('platformSettings.planModal.fields.code')}
                name="code"
                value={planForm.code}
                onChange={handlePlanFieldChange}
                disabled={isEditMode}
                required
              />
              <Input
                label={t('platformSettings.planModal.fields.sortOrder')}
                name="sortOrder"
                type="number"
                value={planForm.sortOrder}
                onChange={handlePlanFieldChange}
              />
              <Input
                label={t('platformSettings.planModal.fields.nameEn')}
                name="nameEn"
                value={planForm.nameEn}
                onChange={handlePlanFieldChange}
                required
              />
              <Input
                label={t('platformSettings.planModal.fields.nameAr')}
                name="nameAr"
                value={planForm.nameAr}
                onChange={handlePlanFieldChange}
              />
              <Input
                label={t('platformSettings.planModal.fields.monthlyAmount')}
                name="monthlyAmount"
                type="number"
                value={planForm.monthlyAmount}
                onChange={handlePlanFieldChange}
              />
              <Input
                label={t('platformSettings.planModal.fields.yearlyAmount')}
                name="yearlyAmount"
                type="number"
                value={planForm.yearlyAmount}
                onChange={handlePlanFieldChange}
              />
              <Input
                label={t('platformSettings.planModal.fields.currency')}
                name="currency"
                value={planForm.currency}
                onChange={handlePlanFieldChange}
              />
              <Input
                label={t('platformSettings.planModal.fields.primaryRegion')}
                name="primaryRegion"
                value={planForm.primaryRegion}
                onChange={handlePlanFieldChange}
              />
              <Input
                label={t('platformSettings.planModal.fields.primaryCountry')}
                name="primaryCountry"
                value={planForm.primaryCountry}
                onChange={handlePlanFieldChange}
              />
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {t('platformSettings.planModal.fields.isActive')}
                  </span>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={planForm.isActive}
                    onChange={handlePlanFieldChange}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FaEdit className="text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {`${t('platformSettings.planModal.fields.descriptionEn')} / ${t('platformSettings.planModal.fields.descriptionAr')}`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('platformSettings.plan.description')}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('platformSettings.planModal.fields.descriptionEn')}
                </label>
                <textarea
                  name="descriptionEn"
                  value={planForm.descriptionEn}
                  onChange={handlePlanFieldChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('platformSettings.planModal.fields.descriptionAr')}
                </label>
                <textarea
                  name="descriptionAr"
                  value={planForm.descriptionAr}
                  onChange={handlePlanFieldChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('platformSettings.plan.featuresTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {enabledFeaturesCount}/{FEATURE_FIELDS.length}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <FaCheckCircle className="text-lg" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {FEATURE_FIELDS.map((feature) => (
                  <label
                    key={feature.key}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 transition-colors ${planForm.features[feature.key]
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-sm font-medium text-slate-700">{getFeatureLabel(feature)}</span>
                    <input
                      type="checkbox"
                      name={`features.${feature.key}`}
                      checked={Boolean(planForm.features[feature.key])}
                      onChange={handlePlanFieldChange}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </Card>

            <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('platformSettings.plan.limitsTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('platformSettings.planModal.limitsHint')}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FaGlobe className="text-lg" />
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                {LIMIT_FIELDS.map((limit) => (
                  <Input
                    key={limit.key}
                    label={getLimitLabel(limit)}
                    name={`limits.${limit.key}`}
                    type="number"
                    value={planForm.limits[limit.key]}
                    onChange={handlePlanFieldChange}
                  />
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <FaGlobe className="text-slate-500" />
                {planForm.primaryRegion || 'MENA'} / {planForm.primaryCountry || 'SA'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <FaCheckCircle className="text-emerald-600" />
                {enabledFeaturesCount}/{FEATURE_FIELDS.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(returnTo)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={planSaving} icon={isEditMode ? FaEdit : FaPlus}>
                {planSaving
                  ? t('common.saving')
                  : (isEditMode
                    ? t('platformSettings.actions.savePlanChanges')
                    : t('platformSettings.actions.createPlan'))}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PlatformPlanEditor;
