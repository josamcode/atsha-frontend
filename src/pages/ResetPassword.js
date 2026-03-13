import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaLock } from 'react-icons/fa';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      showError(t('auth.invalidResetToken'));
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate, t]);

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

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password
      });

      if (response.data.success) {
        showSuccess(t('auth.passwordResetSuccess'));
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { replace: true });
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

  const loginPath = '/login';

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-brand-panel">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-brand-content">
            <img src="/logo.png" alt="Atsha" className="auth-brand-logo" />
            <h1 className="auth-brand-title">{t('auth.passwordResetSuccess')}</h1>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-card-inner" style={{ textAlign: 'center' }}>
              <FaCheckCircle style={{ fontSize: '3.5rem', color: '#10b981', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                {t('auth.passwordResetSuccess')}
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#6b7280' }}>
                {t('auth.redirectingToLogin')}
              </p>
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
          <img src="/logo.png" alt="Atsha" className="auth-brand-logo" />
          <h1 className="auth-brand-title">{t('auth.resetPasswordTitle')}</h1>
          <p className="auth-brand-subtitle">{t('auth.resetPasswordSubtitle')}</p>
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
              <h2>{t('auth.resetPasswordTitle')}</h2>
              <p>{t('auth.resetPasswordSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Input
                label={t('auth.newPassword')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                icon={FaLock}
              />

              <Input
                label={t('auth.confirmPassword')}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                icon={FaLock}
              />

              <Button
                type="submit"
                disabled={loading}
                fullWidth
              >
                {loading ? t('common.loading') : t('auth.resetPassword')}
              </Button>
            </form>

            <p className="auth-footer-text">
              <Link to={loginPath}>{t('auth.backToLogin')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
