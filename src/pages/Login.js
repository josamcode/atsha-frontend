import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import {
  buildPathWithOrganization,
  getDefaultAuthenticatedPath,
  getOrganizationSlugFromSearch
} from '../utils/organization';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = new URLSearchParams(location.search).get('redirect');
  const requestedOrganizationSlug = getOrganizationSlugFromSearch(location.search);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((currentValue) => ({
      ...currentValue,
      [event.target.name]: event.target.value
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password, {
      organizationSlug: requestedOrganizationSlug
    });

    if (result.success) {
      const currentLanguage = localStorage.getItem('language') || 'ar';
      const userLanguage = result.user.languagePreference;
      const nextLanguage = currentLanguage || userLanguage || 'ar';
      const authenticatedOrganizationSlug = result.organization?.slug || null;
      const nextPath = redirectTarget
        ? buildPathWithOrganization(redirectTarget, authenticatedOrganizationSlug)
        : getDefaultAuthenticatedPath(result.user);

      i18n.changeLanguage(nextLanguage);
      localStorage.setItem('language', nextLanguage);
      document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';

      navigate(nextPath, { replace: true });
    } else {
      setError(result.message || t('auth.invalidCredentials'));
    }

    setLoading(false);
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  const forgotPasswordPath = '/forgot-password';

  return (
    <div className="auth-page">
      {/* ── Branded Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-content">
          <img src="/logo.png" alt="AraRM" className="auth-brand-logo" />
          <h1 className="auth-brand-title">{t('auth.loginTitle')}</h1>
          <p className="auth-brand-subtitle">
            {organization?.name
              ? `${t('auth.loginSubtitle')} - ${organization.name}`
              : t('auth.loginWithEmailPassword')}
          </p>
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
            {/* Header */}
            <div className="auth-form-header">
              <h2>{t('auth.loginTitle')}</h2>
              <p>
                {organization?.name
                  ? `${t('auth.loginSubtitle')} - ${organization.name}`
                  : t('auth.loginWithEmailPassword')}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-alert auth-alert-error">{error}</div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Input
                label={t('auth.email')}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                required
                icon={FaEnvelope}
              />

              <Input
                label={t('auth.password')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                icon={FaLock}
              />

              {/* Forgot password link */}
              <div style={{ textAlign: 'end', marginTop: '-0.5rem' }}>
                <Link
                  to={forgotPasswordPath}
                  style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 500, textDecoration: 'none' }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <Button type="submit" disabled={loading} fullWidth>
                  {loading ? t('common.loading') : t('auth.loginButton')}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <p className="auth-footer-text">
              {t('auth.noAccount')}{' '}
              <Link to="/register">{t('auth.registerOrganization')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
