import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';

const RequestPasswordReset = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || '');

  useEffect(() => {
    if (!location.state?.email && !location.state?.notice) {
      return;
    }

    setFormData((currentValue) => ({
      ...currentValue,
      email: location.state?.email || currentValue.email
    }));
    setNotice(location.state?.notice || '');
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice('');

    try {
      const response = await api.post('/auth/request-password-reset', {
        email: formData.email
      });

      if (response.data.success) {
        showSuccess(response.data.message || t('auth.requestPasswordResetSuccess'));
        setSent(true);
      }
    } catch (error) {
      showError(error.response?.data?.message || t('auth.requestPasswordResetError'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  const loginPath = '/login';
  const forgotPasswordPath = '/forgot-password';

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-brand-panel">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-brand-content">
            <img src="/logo.png" alt="AraRM" className="auth-brand-logo" />
            <h1 className="auth-brand-title">{t('auth.requestSent')}</h1>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-card-inner" style={{ textAlign: 'center' }}>
              <FaCheckCircle style={{ fontSize: '3.5rem', color: '#10b981', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                {t('auth.requestSent')}
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                {t('auth.requestSentMessage')}
              </p>
              <Link to={loginPath}>
                <Button>{t('auth.backToLogin')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* ── Branded Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-content">
          <img src="/logo.png" alt="AraRM" className="auth-brand-logo" />
          <h1 className="auth-brand-title">{t('auth.requestPasswordResetTitle')}</h1>
          <p className="auth-brand-subtitle">{t('auth.requestPasswordResetSubtitle')}</p>
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
              <h2>{t('auth.requestPasswordResetTitle')}</h2>
              <p>{t('auth.requestPasswordResetSubtitle')}</p>
            </div>

            {notice && (
              <div className="auth-alert auth-alert-info">{notice}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                disabled={loading}
                fullWidth
              >
                {loading ? t('common.loading') : t('auth.sendRequest')}
              </Button>
            </form>

            <p className="auth-footer-text">
              <Link to={loginPath}>{t('auth.backToLogin')}</Link>
            </p>

            <p className="auth-footer-text" style={{ marginTop: '0.5rem' }}>
              {t('auth.haveResetLink')}{' '}
              <Link to={forgotPasswordPath}>{t('auth.useResetLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPasswordReset;
