import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';

const RequestPasswordReset = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const isRTL = i18n.language === 'ar';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/request-password-reset', { email });
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

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
            <FaCheckCircle className="mx-auto text-6xl text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('auth.requestSent')}
            </h2>
            <p className="text-gray-600">
              {t('auth.requestSentMessage')}
            </p>
            <Link to="/login">
              <Button>
                {t('auth.backToLogin')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Language Switcher */}
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Atsha"
                className="h-16 w-32 group-hover:scale-105 transition-transform"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('auth.requestPasswordResetTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.requestPasswordResetSubtitle')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <FaEnvelope className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
              <Input
                label={t('auth.email')}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? t('common.loading') : t('auth.sendRequest')}
            </Button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
            >
              <FaArrowLeft className={`mr-2 ${isRTL ? 'ml-2 mr-0' : ''}`} />
              {t('auth.backToLogin')}
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>{t('auth.haveResetLink')}</p>
            <Link
              to="/forgot-password"
              className="text-primary hover:text-primary-dark font-medium"
            >
              {t('auth.useResetLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPasswordReset;

