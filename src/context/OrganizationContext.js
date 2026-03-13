import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import {
  buildOrganizationHeaders,
  clearStoredOrganization,
  clearStoredOrganizationSlug,
  getStoredAccessToken,
  getOrganizationSlugFromSearch,
  getResolvedOrganizationSlug,
  getStoredOrganization,
  getStoredOrganizationSlug,
  normalizeOrganizationSlug,
  setStoredOrganization,
  setStoredOrganizationSlug
} from '../utils/organization';

const OrganizationContext = createContext(null);
const PUBLIC_AUTH_PATH_PREFIXES = ['/reset-password/'];
const PUBLIC_AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/request-password-reset'
]);

const isPublicAuthRoute = (pathname = '') => (
  PUBLIC_AUTH_PATHS.has(pathname)
  || PUBLIC_AUTH_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
);

const fetchOrganizationContext = async (organizationSlug) => {
  const normalizedSlug = normalizeOrganizationSlug(organizationSlug);

  if (!normalizedSlug) {
    return {
      success: true,
      organization: null
    };
  }

  try {
    const response = await api.get('/auth/organization', {
      params: { organization: normalizedSlug },
      headers: buildOrganizationHeaders(normalizedSlug)
    });

    return {
      success: true,
      organization: response.data?.data?.organization || null
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to load organization context'
    };
  }
};

export const OrganizationProvider = ({ children }) => {
  const location = useLocation();
  const [organization, setOrganization] = useState(() => getStoredOrganization());
  const [organizationSlug, setOrganizationSlug] = useState(() => getResolvedOrganizationSlug({
    search: typeof window !== 'undefined' ? window.location.search : '',
    organization: getStoredOrganization(),
    fallbackSlug: getStoredOrganizationSlug()
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applyOrganization = useCallback((nextOrganization, fallbackSlug = null) => {
    if (!nextOrganization) {
      clearStoredOrganization();
      setOrganization(null);

      const nextSlug = normalizeOrganizationSlug(fallbackSlug);
      setOrganizationSlug(nextSlug);
      if (nextSlug) {
        setStoredOrganizationSlug(nextSlug);
      } else {
        clearStoredOrganizationSlug();
      }

      return null;
    }

    const nextSlug = normalizeOrganizationSlug(nextOrganization.slug) || normalizeOrganizationSlug(fallbackSlug);
    setOrganization(nextOrganization);
    setStoredOrganization(nextOrganization);

    if (nextSlug) {
      setOrganizationSlug(nextSlug);
      setStoredOrganizationSlug(nextSlug);
    }

    return nextOrganization;
  }, []);

  const clearOrganizationContext = useCallback(({ clearSlug = false } = {}) => {
    clearStoredOrganization();
    setOrganization(null);
    setError('');

    if (clearSlug) {
      clearStoredOrganizationSlug();
      setOrganizationSlug(null);
    }
  }, []);

  const bootstrapOrganization = useCallback(async (slugOverride = null) => {
    const nextSlug = getResolvedOrganizationSlug({
      search: slugOverride ? '' : location.search,
      organization: getStoredOrganization(),
      fallbackSlug: slugOverride || organizationSlug
    });

    setLoading(true);
    setError('');

    if (nextSlug) {
      setStoredOrganizationSlug(nextSlug);
    } else {
      clearStoredOrganizationSlug();
    }

    const result = await fetchOrganizationContext(nextSlug);
    if (result.success) {
      applyOrganization(result.organization, nextSlug);
    } else {
      clearStoredOrganization();
      setOrganization(null);
      setOrganizationSlug(normalizeOrganizationSlug(nextSlug));
      setError(result.message);
    }

    setLoading(false);
    return result;
  }, [applyOrganization, location.search, organizationSlug]);

  const updateOrganizationSlug = useCallback(async (nextSlug) => {
    const normalizedSlug = normalizeOrganizationSlug(nextSlug);

    if (normalizedSlug) {
      setStoredOrganizationSlug(normalizedSlug);
      setOrganizationSlug(normalizedSlug);
    } else {
      clearStoredOrganizationSlug();
      setOrganizationSlug(null);
    }

    return bootstrapOrganization(normalizedSlug);
  }, [bootstrapOrganization]);

  useEffect(() => {
    let ignore = false;

    const loadOrganization = async () => {
      const searchSlug = getOrganizationSlugFromSearch(location.search);
      const nextSlug = getResolvedOrganizationSlug({
        search: location.search,
        organization: getStoredOrganization(),
        fallbackSlug: getStoredOrganizationSlug()
      });
      const shouldSkipBootstrap = (
        !searchSlug
        && !getStoredAccessToken()
        && isPublicAuthRoute(location.pathname)
      );

      if (searchSlug) {
        setStoredOrganizationSlug(searchSlug);
      } else if (!nextSlug) {
        clearStoredOrganizationSlug();
      }

      setLoading(true);
      setError('');

      if (shouldSkipBootstrap) {
        applyOrganization(null, null);
        setLoading(false);
        return;
      }

      const result = await fetchOrganizationContext(nextSlug);
      if (ignore) {
        return;
      }

      if (result.success) {
        applyOrganization(result.organization, nextSlug);
      } else {
        clearStoredOrganization();
        setOrganization(null);
        setOrganizationSlug(normalizeOrganizationSlug(nextSlug));
        setError(result.message);
      }

      setLoading(false);
    };

    loadOrganization();

    return () => {
      ignore = true;
    };
  }, [applyOrganization, location.pathname, location.search]);

  const setOrganizationContext = useCallback((nextOrganization) => {
    return applyOrganization(nextOrganization, organizationSlug);
  }, [applyOrganization, organizationSlug]);

  const value = {
    organization,
    organizationSlug,
    loading,
    error,
    bootstrapOrganization,
    updateOrganizationSlug,
    refreshOrganization: () => bootstrapOrganization(organizationSlug),
    setOrganizationContext,
    clearOrganizationContext,
    hasOrganization: !!organization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }

  return context;
};
