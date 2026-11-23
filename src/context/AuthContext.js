import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { isTokenExpired, refreshAccessToken } from '../utils/api';
import { translateBackendMessage } from '../utils/backendMessageTranslations';
import { useOrganization } from './OrganizationContext';
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredOrganization,
  getStoredRefreshToken,
  getStoredUser,
  normalizeOrganizationSlug,
  setAuthNotice,
  syncStoredAuthSession
} from '../utils/organization';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const {
    organization,
    organizationSlug,
    loading: organizationLoading,
    setOrganizationContext,
    clearOrganizationContext
  } = useOrganization();
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const resolvedOrganizationId = organization?.id || null;

  const clearSession = (preserveOrganization = true) => {
    clearStoredAuthSession({ preserveOrganization });
    setUser(null);
  };

  useEffect(() => {
    if (user) {
      setSignedOut(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;

    const hydrateSession = async () => {
      if (organizationLoading) {
        return;
      }

      const storedUser = getStoredUser();
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!accessToken && !refreshToken) {
        if (storedUser) {
          clearSession(true);
        }

        if (!ignore) {
          setLoading(false);
        }
        return;
      }

      try {
        let nextAccessToken = accessToken;

        if (!nextAccessToken || isTokenExpired(nextAccessToken)) {
          if (!refreshToken || isTokenExpired(refreshToken)) {
            if (!ignore) {
              clearSession(true);
            }
            return;
          }

          const refreshResult = await refreshAccessToken();
          if (!refreshResult.success) {
            if (!ignore && !refreshResult.transient) {
              setAuthNotice(refreshResult.error);
              clearSession(true);
            }
            return;
          }

          nextAccessToken = refreshResult.accessToken;

          if (refreshResult.organization) {
            setOrganizationContext(refreshResult.organization);
          }
        }

        const response = await api.get('/auth/me', { skipAuthRedirect: true });
        const nextUser = response.data?.data?.user || storedUser || null;
        const nextOrganization = response.data?.data?.organization || getStoredOrganization() || null;

        if (ignore) {
          return;
        }

        syncStoredAuthSession({
          user: nextUser,
          accessToken: nextAccessToken,
          refreshToken,
          organization: nextOrganization || undefined
        });

        if (nextOrganization) {
          setOrganizationContext(nextOrganization);
        }

        setUser(nextUser);
      } catch (error) {
        const status = error.response?.status;

        if (!ignore && (status === 401 || status === 403)) {
          setAuthNotice(error.response.data?.message);
          clearSession(true);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      ignore = true;
    };
  }, [organizationLoading, resolvedOrganizationId, setOrganizationContext]);

  const login = async (email, password, options = {}) => {
    const urlOrganizationSlug = normalizeOrganizationSlug(options.organizationSlug);
    const selectedOrganizationSlug = normalizeOrganizationSlug(options.selectedOrganizationSlug);

    try {
      const loginWithOrganization = async (organizationSlug = null) => api.post(
        '/auth/login',
        {
          email,
          password,
          organization: organizationSlug || undefined
        },
        organizationSlug
          ? { organizationSlug }
          : { skipOrganizationHeader: true }
      );

      let response;

      try {
        response = await loginWithOrganization(selectedOrganizationSlug);
      } catch (error) {
        const choices = error.response?.data?.organizations || [];
        const urlChoice = error.response?.data?.code === 'ORGANIZATION_SELECTION_REQUIRED'
          ? choices.find((choice) => choice.slug === urlOrganizationSlug)
          : null;

        if (!urlChoice) {
          throw error;
        }

        response = await loginWithOrganization(urlChoice.slug);
      }

      const { user: nextUser, organization: nextOrganization, accessToken, refreshToken } = response.data.data;

      syncStoredAuthSession({
        user: nextUser,
        accessToken,
        refreshToken,
        organization: nextOrganization || undefined
      });

      if (nextOrganization) {
        setOrganizationContext(nextOrganization);
      }

      setUser(nextUser);

      return {
        success: true,
        user: nextUser,
        organization: nextOrganization || null
      };
    } catch (error) {
      return {
        success: false,
        code: error.response?.data?.code || null,
        organizations: error.response?.data?.organizations || [],
        organizationName: error.response?.data?.organizationName || null,
        message: error.response
          ? (error.response.data?.message || translateBackendMessage('Login failed'))
          : translateBackendMessage('Unable to connect to the server. Check your connection and try again.')
      };
    }
  };

  const registerOrganization = async (payload) => {
    try {
      const response = await api.post(
        '/auth/register-organization',
        payload,
        {
          skipOrganizationHeader: true
        }
      );

      const {
        user: nextUser,
        organization: nextOrganization,
        accessToken,
        refreshToken
      } = response.data.data;

      syncStoredAuthSession({
        user: nextUser,
        accessToken,
        refreshToken,
        organization: nextOrganization || undefined
      });

      if (nextOrganization) {
        setOrganizationContext(nextOrganization);
      }

      setUser(nextUser);

      return {
        success: true,
        user: nextUser,
        organization: nextOrganization || null
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const sendOrganizationVerificationCode = async (payload) => {
    try {
      const response = await api.post(
        '/auth/register-organization/send-verification-code',
        payload,
        {
          skipOrganizationHeader: true
        }
      );

      return {
        success: true,
        message: response.data?.message || 'Verification code sent to your email'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Unable to send verification code'
      };
    }
  };

  const verifyOrganizationEmail = async (payload) => {
    try {
      const response = await api.post(
        '/auth/register-organization/verify-email',
        payload,
        {
          skipOrganizationHeader: true
        }
      );

      return {
        success: true,
        message: response.data?.message || 'Email verified successfully',
        verificationToken: response.data?.data?.verificationToken || ''
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Unable to verify email'
      };
    }
  };

  const acceptInvitation = async (payload, options = {}) => {
    const requestedOrganizationSlug = normalizeOrganizationSlug(options.organizationSlug);

    try {
      const response = await api.post(
        '/invitations/accept',
        {
          ...payload,
          organization: requestedOrganizationSlug || undefined
        },
        {
          organizationSlug: requestedOrganizationSlug || undefined,
          skipOrganizationHeader: !requestedOrganizationSlug
        }
      );

      const {
        user: nextUser,
        organization: nextOrganization,
        accessToken,
        refreshToken
      } = response.data.data;

      syncStoredAuthSession({
        user: nextUser,
        accessToken,
        refreshToken,
        organization: nextOrganization || undefined
      });

      if (nextOrganization) {
        setOrganizationContext(nextOrganization);
      }

      setUser(nextUser);

      return {
        success: true,
        user: nextUser,
        organization: nextOrganization || null
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invitation acceptance failed'
      };
    }
  };

  const logout = async () => {
    const refreshToken = getStoredRefreshToken();

    setSignedOut(true);
    clearSession(false);
    clearOrganizationContext({ clearSlug: true });

    try {
      await api.post(
        '/auth/logout',
        { refreshToken },
        { skipOrganizationHeader: true, skipAuthRedirect: true }
      );
    } catch (error) {
      // The local session is already gone.
    }
  };

  const updateUser = (updatedUser) => {
    const nextUser = { ...user, ...updatedUser };
    setUser(nextUser);

    syncStoredAuthSession({
      user: nextUser,
      accessToken: getStoredAccessToken(),
      refreshToken: getStoredRefreshToken(),
      organization
    });
  };

  const value = {
    user,
    organization,
    organizationSlug,
    loading: loading || organizationLoading,
    signedOut,
    login,
    registerOrganization,
    sendOrganizationVerificationCode,
    verifyOrganizationEmail,
    acceptInvitation,
    logout,
    updateUser,
    clearSession,
    isAuthenticated: !!user && !!organization
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
