import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import { FaLock, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';

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
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!token) {
      showError(t('auth.invalidResetToken'));
      navigate('/forgot-password');
    }
  }, [token, navigate, t]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      showError(error.response?.data?.message || t('auth.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

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
              {t('auth.resetPasswordTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.resetPasswordSubtitle')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <FaLock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-10 text-gray-400`} />
              <Input
                label={t('auth.newPassword')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
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
                placeholder="••••••••"
                required
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? t('common.loading') : t('auth.resetPassword')}
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
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

