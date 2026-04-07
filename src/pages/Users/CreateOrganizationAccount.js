import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBuilding,
  FaCheckCircle,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaShieldAlt,
  FaUser
} from 'react-icons/fa';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import PageTitle from '../../components/Common/PageTilte';
import api from '../../utils/api';
import { showSuccess } from '../../utils/toast';

const buildInitialFormState = () => ({
  organizationName: '',
  organizationSlug: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
});

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const CreateOrganizationAccount = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const BackIcon = isRTL ? FaArrowRight : FaArrowLeft;
  const [formData, setFormData] = useState(buildInitialFormState());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const summaryItems = [
    t('users.organizationAccountSummaryOrganization'),
    t('users.organizationAccountSummaryAdmin'),
    t('users.organizationAccountSummaryAccess')
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const organizationName = String(formData.organizationName || '').trim();
    const organizationSlug = String(formData.organizationSlug || '').trim().toLowerCase();
    const adminName = String(formData.name || '').trim();
    const email = normalizeEmail(formData.email);

    if (!organizationName || !adminName || !email || !formData.password) {
      setError(t('common.required'));
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

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/organizations/account', {
        organizationName,
        organizationSlug: organizationSlug || undefined,
        name: adminName,
        email,
        phone: String(formData.phone || '').trim() || undefined,
        password: formData.password,
        languagePreference: isRTL ? 'ar' : 'en'
      });

      showSuccess(t('users.organizationAccountCreated'));

      const createdOrganizationId =
        response.data?.data?.organization?.id ||
        response.data?.data?.organization?._id;

      if (createdOrganizationId) {
        navigate(`/platform/organizations/${createdOrganizationId}`, {
          replace: true,
          state: {
            returnTo: '/users'
          }
        });
        return;
      }

      navigate('/users', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('auth.organizationRegistrationError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PageTitle
            icon={FaBuilding}
            title={t('users.createOrganizationAccount')}
            description={t('users.createOrganizationAccountDescription')}
          />

          <Button
            variant="outline"
            onClick={() => navigate('/users')}
            icon={BackIcon}
            className="w-full lg:w-auto"
          >
            {t('common.back')}
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_24rem]">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-gray-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <FaShieldAlt className="text-xs" />
                {t('users.organizationAccountAutoVerifyBadge')}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                {t('auth.registerOrganizationTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                {t('users.organizationAccountAutoVerifyHint')}
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={t('auth.organizationName')}
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Nile Foods"
                    required
                    icon={FaBuilding}
                    className="md:col-span-2"
                  />

                  <div className="md:col-span-2">
                    <Input
                      label={`${t('auth.organizationSlug')} (${t('common.optional')})`}
                      type="text"
                      name="organizationSlug"
                      value={formData.organizationSlug}
                      onChange={handleChange}
                      placeholder="nile-foods"
                      icon={FaBuilding}
                      className="mb-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('users.organizationSlugHint')}
                    </p>
                  </div>

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

                  <Input
                    label={t('auth.phone')}
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+201234567890"
                    icon={FaPhone}
                  />

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                    <p className="font-semibold">
                      {t('users.organizationAccountAutoVerifyBadge')}
                    </p>
                    <p className="mt-1 text-emerald-800">
                      {t('users.organizationAccountAutoVerifyHint')}
                    </p>
                  </div>

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
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={submitting} icon={FaBuilding}>
                    {submitting ? t('common.loading') : t('users.createOrganizationAccount')}
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('users.organizationAccountSummaryTitle')}
            </h3>

            <div className="mt-4 space-y-4">
              {summaryItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                >
                  <FaCheckCircle className="mt-0.5 text-emerald-600" />
                  <p className="text-sm leading-6 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateOrganizationAccount;
