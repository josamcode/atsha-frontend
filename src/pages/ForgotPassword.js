import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope } from 'react-icons/fa';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email: formData.email
      });

      if (response.data.success) {
        if (response.data.requiresAdminReset) {
          navigate('/request-password-reset', {
            replace: true,
            state: {
              email: formData.email.trim(),
              notice: response.data.message
            }
          });
          return;
        }

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

  const loginPath = '/login';
  const requestResetPath = '/request-password-reset';

  return (
    <div className="auth-page">
      {/* ── Branded Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-content">
          <img src="/logo.png" alt="AraRM" className="auth-brand-logo" />
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

            {!sent ? (
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
