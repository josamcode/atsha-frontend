import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaBuilding,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import { getDefaultAuthenticatedPath } from '../utils/organization';

const RegisterOrganization = () => {
  const { t, i18n } = useTranslation();
  const { registerOrganization } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organizationName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
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
      email: formData.email,
      phone: formData.phone,
      password: formData.password
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
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
                alt="Atsha"
                className="h-16 w-32 group-hover:scale-105 transition-transform"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('auth.registerOrganizationTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.registerOrganizationSubtitle')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-primary border-l-4 border-primary text-white px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative md:col-span-2">
                <FaBuilding className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.organizationName')}
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Nile Foods"
                  required
                  className="pl-10"
                />
              </div>

              <div className="relative md:col-span-2">
                <FaUser className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.name')}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Admin User"
                  required
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <FaEnvelope className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.email')}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <FaPhone className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.phone')}
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+201234567890"
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
                  placeholder="********"
                  required
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <FaLock className="absolute left-3 top-10 text-gray-400" />
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="********"
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
              {loading ? t('common.loading') : t('auth.registerOrganizationButton')}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
              {t('common.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;
