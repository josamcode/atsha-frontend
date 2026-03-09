import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaBuilding, FaEnvelope } from 'react-icons/fa';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';
import { useOrganization } from '../context/OrganizationContext';
import { buildPathWithOrganization, normalizeOrganizationSlug } from '../utils/organization';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const {
    organization,
    organizationSlug,
    loading: organizationLoading,
    error: organizationError,
    updateOrganizationSlug
  } = useOrganization();
  const [formData, setFormData] = useState({
    email: '',
    organizationSlug: organizationSlug || organization?.slug || ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    setFormData((currentValue) => ({
      ...currentValue,
      organizationSlug: organizationSlug || organization?.slug || currentValue.organizationSlug
    }));
  }, [organizationSlug, organization?.slug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const requestedOrganizationSlug = normalizeOrganizationSlug(formData.organizationSlug);

    if (requestedOrganizationSlug && requestedOrganizationSlug !== organizationSlug) {
      const bootstrapResult = await updateOrganizationSlug(requestedOrganizationSlug);
      if (!bootstrapResult.success) {
        showError(bootstrapResult.message || 'Organization not found');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.post(
        '/auth/forgot-password',
        {
          email: formData.email,
          organization: requestedOrganizationSlug || undefined
        },
        {
          organizationSlug: requestedOrganizationSlug || undefined
        }
      );

      if (response.data.success) {
        showSuccess(response.data.message || t('auth.forgotPasswordSuccess'));
        setSent(true);
      }
    } catch (error) {
      showError(error.response?.data?.message || t('auth.forgotPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  const loginPath = buildPathWithOrganization('/login', formData.organizationSlug || organizationSlug);
  const requestResetPath = buildPathWithOrganization('/request-password-reset', formData.organizationSlug || organizationSlug);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex justify-end space-x-2 mb-8">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${i18n.language === 'en'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage('ar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${i18n.language === 'ar'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            AR
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt={organization?.name || 'Atsha'}
                className="h-16 w-32 group-hover:scale-105 transition-transform"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('auth.forgotPasswordTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.forgotPasswordSubtitle')}
            </p>
          </div>

          <div className={`rounded-xl border px-4 py-3 ${organization
            ? 'border-emerald-200 bg-emerald-50'
            : organizationError
              ? 'border-primary/30 bg-primary/5'
              : 'border-gray-200 bg-gray-50'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Organization</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {organization?.name || (organizationLoading ? 'Resolving organization...' : 'No organization selected')}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {organization?.slug || formData.organizationSlug || 'Reset links are scoped to an organization.'}
            </p>
            {!organization && organizationError && (
              <p className="text-xs text-primary mt-2">{organizationError}</p>
            )}
          </div>

          {!sent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <FaBuilding className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
                <Input
                  label="Organization Slug"
                  type="text"
                  name="organizationSlug"
                  value={formData.organizationSlug}
                  onChange={(event) => setFormData((currentValue) => ({
                    ...currentValue,
                    organizationSlug: event.target.value
                  }))}
                  placeholder="your-organization"
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>

              <div className="relative">
                <FaEnvelope className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
                <Input
                  label={t('auth.email')}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(event) => setFormData((currentValue) => ({
                    ...currentValue,
                    email: event.target.value
                  }))}
                  placeholder="example@gmail.com"
                  required
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || organizationLoading}
                fullWidth
              >
                {loading ? t('common.loading') : t('auth.sendResetLink')}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded">
                <p className="font-medium">{t('auth.resetLinkSent')}</p>
                <p className="text-sm mt-1">{t('auth.checkEmailInstructions')}</p>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link
              to={loginPath}
              className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
            >
              <FaArrowLeft className={`mr-2 ${isRTL ? 'ml-2 mr-0' : ''}`} />
              {t('auth.backToLogin')}
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>{t('auth.noResetLink')}</p>
            <Link
              to={requestResetPath}
              className="text-primary hover:text-primary-dark font-medium"
            >
              {t('auth.requestFromAdmin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
