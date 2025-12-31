import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import { FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Set language: prioritize current language in localStorage, then user preference, then default to Arabic
      // This prevents switching from Arabic to English if user is already using Arabic
      const currentLang = localStorage.getItem('language') || 'ar';
      const userLang = result.user.languagePreference;

      // Only use user preference if current language is not set or if user explicitly wants to change
      // Otherwise, keep the current language (which defaults to Arabic)
      const finalLang = currentLang || userLang || 'ar';

      i18n.changeLanguage(finalLang);
      localStorage.setItem('language', finalLang);
      document.documentElement.dir = finalLang === 'ar' ? 'rtl' : 'ltr';

      // Redirect qr-manager to /qr, others to dashboard
      const redirectTo = result.user.role === 'qr-manager' ? '/qr' : '/dashboard';
      navigate(redirectTo);
    } else {
      setError(result.message || t('auth.invalidCredentials'));
    }

    setLoading(false);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

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

        {/* Login Card */}
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
              {t('auth.loginTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-primary border-l-4 border-primary text-primary px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.email')}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  required
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <FaLock className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.password')}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? t('common.loading') : t('auth.loginButton')}
            </Button>
          </form>

          <div className="text-center space-y-2 mt-4">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-primary-dark"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

