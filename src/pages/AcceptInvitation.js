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
  const orgDisplayName = preview?.organization?.branding?.displayName || preview?.organization?.name || organization?.name || 'Organization Invitation';

  return (
    <div className="auth-page">
      {/* ── Branded Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-content">
          <img src="/logo.png" alt="Atsha" className="auth-brand-logo" />
          <h1 className="auth-brand-title">{orgDisplayName}</h1>
          <p className="auth-brand-subtitle">
            Complete your account setup to join this organization.
          </p>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card" style={{ maxWidth: 520 }}>
          <div className="auth-card-inner">
            {/* Invitation preview badge */}
            {preview && (
              <div className="auth-verify-section verified" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.15rem' }}>Email</p>
                    <p style={{ fontWeight: 600, color: '#111827' }}>{preview.invitation?.email}</p>
                  </div>
                  <div>
                    <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.15rem' }}>Role</p>
                    <p style={{ fontWeight: 600, color: '#111827' }}>
                      {getRoleLabel(preview.invitation?.organizationRole || preview.invitation?.role, t, i18n.language)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.15rem' }}>Department</p>
                    <p style={{ fontWeight: 600, color: '#111827' }}>
                      {getDepartmentLabel(preview.invitation?.department, preview.organization, t, i18n.language)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="auth-alert auth-alert-error">{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Input
                label={t('auth.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                icon={FaUser}
              />

              <Input
                label={t('auth.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                icon={FaPhone}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <div>
                  <Input
                    label={t('auth.password')}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    icon={FaLock}
                  />
                </div>
                <div>
                  <Input
                    label={t('auth.confirmPassword')}
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    icon={FaLock}
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} fullWidth>
                {submitting ? t('common.loading') : 'Accept Invitation'}
              </Button>
            </form>

            {/* Footer */}
            <div className="auth-footer-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FaEnvelope style={{ color: '#059669', fontSize: '0.85rem' }} />
              <span>
                Already have access? <Link to={loginPath}>Sign in</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
