import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaBuilding,
  FaCheck,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaShieldAlt,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import { getDefaultAuthenticatedPath } from '../utils/organization';

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const RegisterOrganization = () => {
  const { t, i18n } = useTranslation();
  const {
    registerOrganization,
    sendOrganizationVerificationCode,
    verifyOrganizationEmail
  } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organizationName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [codeSentEmail, setCodeSentEmail] = useState('');

  const normalizedEmail = normalizeEmail(formData.email);
  const isEmailVerified = Boolean(emailVerificationToken) && verifiedEmail === normalizedEmail;
  const canVerifyCurrentEmail = codeSentEmail === normalizedEmail;

  const clearVerificationState = () => {
    setEmailVerificationToken('');
    setVerifiedEmail('');
    setCodeSentEmail('');
    setFormData((currentValue) => ({
      ...currentValue,
      verificationCode: ''
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'email') {
      const nextEmail = normalizeEmail(value);
      if (nextEmail !== normalizedEmail) {
        clearVerificationState();
      }
    }

    if (name === 'verificationCode' && isEmailVerified) {
      setEmailVerificationToken('');
      setVerifiedEmail('');
    }

    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value
    }));
    setError('');
    setStatusMessage('');
  };

  const handleSendVerificationCode = async () => {
    if (!normalizedEmail) {
      setError(t('auth.emailRequiredForVerification'));
      return;
    }

    setVerificationLoading(true);
    setError('');
    setStatusMessage('');
    setEmailVerificationToken('');
    setVerifiedEmail('');

    const result = await sendOrganizationVerificationCode({
      email: normalizedEmail,
      organizationName: formData.organizationName,
      languagePreference: i18n.language === 'ar' ? 'ar' : 'en'
    });

    if (result.success) {
      setCodeSentEmail(normalizedEmail);
      setFormData((currentValue) => ({
        ...currentValue,
        verificationCode: ''
      }));
      setStatusMessage(t('auth.verificationCodeSent'));
    } else {
      setError(result.message || t('auth.organizationRegistrationError'));
    }

    setVerificationLoading(false);
  };

  const handleVerifyEmail = async () => {
    if (!normalizedEmail) {
      setError(t('auth.emailRequiredForVerification'));
      return;
    }

    if (!formData.verificationCode.trim()) {
      setError(t('auth.verificationCodeRequired'));
      return;
    }

    setVerificationLoading(true);
    setError('');
    setStatusMessage('');

    const result = await verifyOrganizationEmail({
      email: normalizedEmail,
      code: formData.verificationCode.trim()
    });

    if (result.success) {
      setEmailVerificationToken(result.verificationToken);
      setVerifiedEmail(normalizedEmail);
      setCodeSentEmail(normalizedEmail);
      setStatusMessage(t('auth.emailVerified'));
    } else {
      setError(result.message || t('auth.verifyEmailBeforeRegister'));
    }

    setVerificationLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isEmailVerified) {
      setError(t('auth.verifyEmailBeforeRegister'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    setError('');

    const result = await registerOrganization({
      organizationName: formData.organizationName,
      name: formData.name,
      email: normalizedEmail,
      phone: formData.phone,
      password: formData.password,
      emailVerificationToken,
      languagePreference: i18n.language === 'ar' ? 'ar' : 'en'
    });

    if (result.success) {
      const currentLanguage = localStorage.getItem('language') || 'ar';
      const userLanguage = result.user.languagePreference;
      const nextLanguage = currentLanguage || userLanguage || 'ar';

      i18n.changeLanguage(nextLanguage);
      localStorage.setItem('language', nextLanguage);
      document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';

      navigate(getDefaultAuthenticatedPath(result.user), { replace: true });
    } else {
      setError(result.message || t('auth.organizationRegistrationError'));
    }

    setLoading(false);
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  /* Derive visual step (purely cosmetic) */
  const currentStep = isEmailVerified ? 3 : canVerifyCurrentEmail ? 2 : 1;

  return (
    <div className="auth-page">
      {/* ── Branded Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-content">
          <img src="/logo.png" alt="Atsha" className="auth-brand-logo" />
          <h1 className="auth-brand-title">{t('auth.registerOrganizationTitle')}</h1>
          <p className="auth-brand-subtitle">{t('auth.registerOrganizationSubtitle')}</p>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className={`auth-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
              <div className="auth-step-dot">{currentStep > 1 ? <FaCheck size={12} /> : '1'}</div>
              <span className="auth-step-label">{t('auth.organizationName')}</span>
            </div>
            <div className={`auth-step-connector ${currentStep > 1 ? 'filled' : ''}`} />
            <div className={`auth-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
              <div className="auth-step-dot">{currentStep > 2 ? <FaCheck size={12} /> : '2'}</div>
              <span className="auth-step-label">{t('auth.verifyEmail')}</span>
            </div>
            <div className={`auth-step-connector ${currentStep > 2 ? 'filled' : ''}`} />
            <div className={`auth-step ${currentStep === 3 ? 'active' : ''}`}>
              <div className="auth-step-dot">3</div>
              <span className="auth-step-label">{t('auth.password')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card" style={{ maxWidth: 520 }}>
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
              <h2>{t('auth.registerOrganizationTitle')}</h2>
              <p>{t('auth.registerOrganizationSubtitle')}</p>
            </div>

            {/* Alerts */}
            {error && <div className="auth-alert auth-alert-error">{error}</div>}
            {statusMessage && (
              <div className={`auth-alert ${isEmailVerified ? 'auth-alert-success' : 'auth-alert-info'}`}>
                {statusMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {/* Organization & Admin name */}
              <Input
                label={t('auth.organizationName')}
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Nile Foods"
                required
                icon={FaBuilding}
              />

              <Input
                label={t('auth.yourName')}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Admin User"
                required
                icon={FaUser}
              />

              {/* Email */}
              <Input
                label={t('auth.email')}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                icon={FaEnvelope}
              />

              {/* ── Verification Section ── */}
              <div className={`auth-verify-section ${isEmailVerified ? 'verified' : ''}`}>
                <div className="auth-verify-header">
                  <div className="auth-verify-status">
                    <span className="auth-verify-status-dot" />
                    <span style={{ color: isEmailVerified ? '#047857' : '#6b7280' }}>
                      {isEmailVerified
                        ? t('auth.emailVerified')
                        : t('auth.verifyEmailBeforeRegisterHint')}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerificationCode}
                    disabled={verificationLoading || !normalizedEmail}
                    className="text-xs"
                  >
                    {verificationLoading
                      ? t('common.loading')
                      : canVerifyCurrentEmail
                        ? t('auth.resendVerificationCode')
                        : t('auth.sendVerificationCode')}
                  </Button>
                </div>

                <div className="auth-verify-code-row">
                  <div className="auth-verify-code-input">
                    <Input
                      label={t('auth.verificationCode')}
                      type="text"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      placeholder="123456"
                      disabled={!canVerifyCurrentEmail}
                      icon={FaShieldAlt}
                    />
                  </div>
                  <div style={{ paddingBottom: '1rem' }}>
                    <Button
                      type="button"
                      variant={isEmailVerified ? 'success' : 'secondary'}
                      onClick={handleVerifyEmail}
                      disabled={
                        verificationLoading ||
                        !canVerifyCurrentEmail ||
                        !formData.verificationCode.trim() ||
                        isEmailVerified
                      }
                    >
                      {verificationLoading
                        ? t('common.loading')
                        : isEmailVerified
                          ? t('auth.emailVerified')
                          : t('auth.verifyEmail')}
                    </Button>
                  </div>
                </div>

                <p className="auth-verify-hint">
                  {isEmailVerified
                    ? t('auth.emailVerified')
                    : canVerifyCurrentEmail
                      ? t('auth.verificationCodeSentHint', { email: normalizedEmail })
                      : t('auth.enterEmailToSendCode')}
                </p>
              </div>

              {/* Phone + passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4" style={{ marginTop: '0.5rem' }}>
                <div>
                  <Input
                    label={t('auth.phone')}
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+201234567890"
                    icon={FaPhone}
                  />
                </div>

                <div>
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
                </div>
              </div>

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
                disabled={loading || verificationLoading || !isEmailVerified}
                fullWidth
              >
                {loading ? t('common.loading') : t('auth.registerOrganizationButton')}
              </Button>
            </form>

            {/* Footer */}
            <p className="auth-footer-text">
              {t('auth.hasAccount')}{' '}
              <Link to="/login">{t('common.login')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;
