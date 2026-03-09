import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaBuilding, FaCheckCircle, FaLock } from 'react-icons/fa';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';
import { useOrganization } from '../context/OrganizationContext';
import { buildPathWithOrganization, normalizeOrganizationSlug } from '../utils/organization';

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const {
    organization,
    organizationSlug,
    loading: organizationLoading,
    error: organizationError,
    updateOrganizationSlug
  } = useOrganization();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    organizationSlug: organizationSlug || organization?.slug || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!token) {
      showError(t('auth.invalidResetToken'));
      navigate(buildPathWithOrganization('/forgot-password', organizationSlug), { replace: true });
    }
  }, [token, navigate, t, organizationSlug]);

  useEffect(() => {
    setFormData((currentValue) => ({
      ...currentValue,
      organizationSlug: organizationSlug || organization?.slug || currentValue.organizationSlug
    }));
  }, [organizationSlug, organization?.slug]);

  const handleChange = (event) => {
    setFormData((currentValue) => ({
      ...currentValue,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      showError(t('auth.passwordTooShort'));
      return;
    }

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
        `/auth/reset-password/${token}`,
        {
          password: formData.password,
          organization: requestedOrganizationSlug || undefined
        },
        {
          organizationSlug: requestedOrganizationSlug || undefined
        }
      );

      if (response.data.success) {
        showSuccess(t('auth.passwordResetSuccess'));
        setSuccess(true);
        setTimeout(() => {
          navigate(buildPathWithOrganization('/login', requestedOrganizationSlug || organizationSlug), { replace: true });
        }, 2000);
      }
    } catch (error) {
      showError(error.response?.data?.message || t('auth.passwordResetError'));
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
            <FaCheckCircle className="mx-auto text-6xl text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-gray-600">
              {t('auth.redirectingToLogin')}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              {t('auth.resetPasswordTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.resetPasswordSubtitle')}
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
              {organization?.slug || formData.organizationSlug || 'Reset tokens must match the active organization.'}
            </p>
            {!organization && organizationError && (
              <p className="text-xs text-primary mt-2">{organizationError}</p>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <FaBuilding className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
              <Input
                label="Organization Slug"
                type="text"
                name="organizationSlug"
                value={formData.organizationSlug}
                onChange={handleChange}
                placeholder="your-organization"
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <div className="relative">
              <FaLock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
              <Input
                label={t('auth.newPassword')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                required
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <div className="relative">
              <FaLock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                required
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || organizationLoading}
              fullWidth
            >
              {loading ? t('common.loading') : t('auth.resetPassword')}
            </Button>
          </form>

          <div className="text-center">
            <Link
              to={loginPath}
              className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
            >
              <FaArrowLeft className={`mr-2 ${isRTL ? 'ml-2 mr-0' : ''}`} />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
