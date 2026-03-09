import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaLock, FaPhone, FaUser } from 'react-icons/fa';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import Loading from '../components/Common/Loading';
import api from '../utils/api';
import { showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import {
  buildPathWithOrganization,
  getDefaultAuthenticatedPath,
  getOrganizationSlugFromSearch
} from '../utils/organization';
import {
  getDepartmentLabel,
  getRoleLabel
} from '../utils/organizationUi';

const AcceptInvitation = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { acceptInvitation } = useAuth();
  const { organization, organizationSlug } = useOrganization();
  const invitationToken = new URLSearchParams(location.search).get('token');
  const requestedOrganizationSlug = getOrganizationSlugFromSearch(location.search);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadPreview = async () => {
      if (!invitationToken) {
        setError('Invitation token is missing');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/invitations/public/${invitationToken}`, {
          params: requestedOrganizationSlug ? { organization: requestedOrganizationSlug } : undefined,
          organizationSlug: requestedOrganizationSlug || undefined,
          skipOrganizationHeader: !requestedOrganizationSlug
        });

        setPreview(response.data.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [invitationToken, requestedOrganizationSlug]);

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

    setSubmitting(true);
    const result = await acceptInvitation({
      token: invitationToken,
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
      languagePreference: i18n.language
    }, {
      organizationSlug: requestedOrganizationSlug || organizationSlug
    });

    if (result.success) {
      navigate(getDefaultAuthenticatedPath(result.user), { replace: true });
      return;
    }

    setError(result.message || 'Failed to accept invitation');
    showError(result.message || 'Failed to accept invitation');
    setSubmitting(false);
  };

  if (loading) {
    return <Loading />;
  }

  const loginPath = buildPathWithOrganization('/login', requestedOrganizationSlug || organizationSlug);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">
            {preview?.organization?.branding?.displayName || preview?.organization?.name || organization?.name || 'Organization Invitation'}
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Complete your account setup to join this organization.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {preview && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{preview.invitation?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium text-gray-900">{getRoleLabel(preview.invitation?.organizationRole || preview.invitation?.role, t, i18n.language)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">
                    {getDepartmentLabel(preview.invitation?.department, preview.organization, t, i18n.language)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary">
              {error}
            </div>
          )}

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div className="md:col-span-2 relative">
              <FaUser className="absolute left-3 top-10 text-gray-400" />
              <Input
                label={t('auth.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="pl-10"
              />
            </div>

            <div className="md:col-span-2 relative">
              <FaPhone className="absolute left-3 top-10 text-gray-400" />
              <Input
                label={t('auth.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
                required
                className="pl-10"
              />
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting} fullWidth>
                {submitting ? t('common.loading') : 'Accept Invitation'}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaEnvelope className="text-primary" />
            <span>
              Already have access? <Link to={loginPath} className="text-primary hover:text-primary-dark font-medium">Sign in</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
