import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBuilding, FaEnvelope } from 'react-icons/fa';
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
    <div className="auth-page">
      {/* ── Branded Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-content">
          <img src="/logo.png" alt={organization?.name || 'Atsha'} className="auth-brand-logo" />
          <h1 className="auth-brand-title">{t('auth.forgotPasswordTitle')}</h1>
          <p className="auth-brand-subtitle">{t('auth.forgotPasswordSubtitle')}</p>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Language switcher */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div className="auth-lang-switcher">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`auth-lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('ar')}
                className={`auth-lang-btn ${i18n.language === 'ar' ? 'active' : ''}`}
              >
                AR
              </button>
            </div>
          </div>

          <div className="auth-card-inner">
            <div className="auth-form-header">
              <h2>{t('auth.forgotPasswordTitle')}</h2>
              <p>{t('auth.forgotPasswordSubtitle')}</p>
            </div>

            {/* Organization info badge */}
            <div className={`auth-verify-section ${organization ? 'verified' : ''}`} style={{ marginBottom: '1.25rem' }}>
              <div className="auth-verify-status">
                <span className="auth-verify-status-dot" />
                <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.82rem' }}>
                  {organization?.name || (organizationLoading ? 'Resolving organization...' : 'No organization selected')}
                </span>
              </div>
              <p className="auth-verify-hint" style={{ marginTop: '0.25rem' }}>
                {organization?.slug || formData.organizationSlug || 'Reset links are scoped to an organization.'}
              </p>
              {!organization && organizationError && (
                <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem' }}>{organizationError}</p>
              )}
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                  icon={FaBuilding}
                />

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
                  icon={FaEnvelope}
                />

                <Button
                  type="submit"
                  disabled={loading || organizationLoading}
                  fullWidth
                >
                  {loading ? t('common.loading') : t('auth.sendResetLink')}
                </Button>
              </form>
            ) : (
              <div className="auth-alert auth-alert-success" style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('auth.resetLinkSent')}</p>
                <p style={{ fontSize: '0.82rem' }}>{t('auth.checkEmailInstructions')}</p>
              </div>
            )}

            <p className="auth-footer-text">
              <Link to={loginPath}>{t('auth.backToLogin')}</Link>
            </p>

            <p className="auth-footer-text" style={{ marginTop: '0.5rem' }}>
              {t('auth.noResetLink')}{' '}
              <Link to={requestResetPath}>{t('auth.requestFromAdmin')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
