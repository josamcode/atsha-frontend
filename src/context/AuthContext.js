import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { isTokenExpired, refreshAccessToken } from '../utils/api';
import { useOrganization } from './OrganizationContext';
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredOrganization,
  getStoredRefreshToken,
  getStoredUser,
  getTokenOrganizationId,
  normalizeOrganizationSlug,
  syncStoredAuthSession
} from '../utils/organization';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const {
    organization,
    organizationSlug,
    loading: organizationLoading,
    setOrganizationContext
  } = useOrganization();
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const resolvedOrganizationId = organization?.id || null;

  const clearSession = (preserveOrganization = true) => {
    clearStoredAuthSession({ preserveOrganization });
    setUser(null);
  };

  useEffect(() => {
    let ignore = false;

    const hydrateSession = async () => {
      if (organizationLoading) {
        return;
      }

      const storedUser = getStoredUser();
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();
      const sessionOrganizationId =
        getTokenOrganizationId(accessToken) || getTokenOrganizationId(refreshToken);

      if (!resolvedOrganizationId && (accessToken || refreshToken)) {
        clearSession(true);
        if (!ignore) {
          setLoading(false);
        }
        return;
      }

      if (resolvedOrganizationId && sessionOrganizationId && resolvedOrganizationId !== sessionOrganizationId) {
        clearSession(true);
        if (!ignore) {
          setLoading(false);
        }
        return;
      }

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
            throw new Error('Session expired');
          }

          const refreshResult = await refreshAccessToken();
          if (!refreshResult.success) {
            throw new Error(refreshResult.error || 'Unable to refresh session');
          }

          nextAccessToken = refreshResult.accessToken;

          if (refreshResult.organization) {
            setOrganizationContext(refreshResult.organization);
          }
        }

        const response = await api.get('/auth/me');
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
        if (!ignore) {
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
    const requestedOrganizationSlug = normalizeOrganizationSlug(options.organizationSlug);

    try {
      const response = await api.post(
        '/auth/login',
        {
          email,
          password,
          organization: requestedOrganizationSlug || undefined
        },
        {
          organizationSlug: requestedOrganizationSlug || undefined,
          skipOrganizationHeader: !requestedOrganizationSlug
        }
      );

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
        message: error.response?.data?.message || 'Login failed'
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
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout should still clear local session state.
    } finally {
      clearSession(true);
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
