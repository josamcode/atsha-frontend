import axios from 'axios';
import { showError } from './toast';
import {
  getLocalizedRateLimitMessage,
  getLocalizedSessionExpiredMessage,
  localizeBackendPayload,
  translateBackendMessage
} from './backendMessageTranslations';
import {
  buildLoginPath,
  buildOrganizationHeaders,
  clearStoredAuthSession,
  decodeJwtPayload,
  getResolvedOrganizationSlug,
  getStoredAccessToken,
  getStoredOrganization,
  getStoredOrganizationSlug,
  getStoredRefreshToken,
  setAuthNotice,
  setStoredAccessToken,
  setStoredOrganization
} from './organization';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let failedQueue = [];

const SESSION_ENDING_CODES = new Set([
  'ACCOUNT_DEACTIVATED',
  'ORGANIZATION_INACTIVE',
  'ORGANIZATION_SUSPENDED',
  'PASSWORD_CHANGED',
  'REFRESH_TOKEN_INVALID',
  'SESSION_ORGANIZATION_NOT_FOUND',
  'SESSION_REVOKED',
  'SESSION_ROLE_CHANGED',
  'SESSION_USER_NOT_FOUND',
  'TOKEN_INVALID',
  'USER_NOT_IN_ORGANIZATION'
]);

const PUBLIC_AUTH_URLS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/logout',
  '/auth/organization',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/request-password-reset',
  '/invitations/public',
  '/invitations/accept'
];

const isPublicAuthRequest = (url = '') => PUBLIC_AUTH_URLS.some((entry) => url.includes(entry));

const getActiveOrganizationSlug = () => {
  const sessionOrganization = getStoredAccessToken() ? getStoredOrganization() : null;

  return sessionOrganization?.slug || getResolvedOrganizationSlug({
    search: typeof window !== 'undefined' ? window.location.search : '',
    organization: getStoredOrganization(),
    fallbackSlug: getStoredOrganizationSlug()
  });
};

const endSession = (message) => {
  const loginPath = buildLoginPath(
    {
      pathname: window.location.pathname,
      search: window.location.search
    },
    getActiveOrganizationSlug()
  );

  clearStoredAuthSession({ preserveOrganization: false });
  setAuthNotice(message || getLocalizedSessionExpiredMessage());

  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace(loginPath);
  }

  const sessionError = new Error('Session expired');
  sessionError.isSessionEnded = true;
  return sessionError;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }

    request.resolve(token);
  });

  failedQueue = [];
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  maxRedirects: 5,
  validateStatus: (status) => {
    return (status >= 200 && status < 300) || (status >= 300 && status < 400);
  }
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (!config.headers) {
      config.headers = {};
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const explicitOrganizationSlug =
      config.organizationSlug ||
      config.params?.organizationSlug ||
      config.params?.organization ||
      config.data?.organizationSlug ||
      config.data?.organization;

    if (!config.skipOrganizationHeader) {
      Object.assign(
        config.headers,
        buildOrganizationHeaders(explicitOrganizationSlug || getActiveOrganizationSlug())
      );
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response?.data && typeof response.data === 'object') {
      localizeBackendPayload(response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const rawResponseMessage = error.response?.data?.message;
    const rawResponseError = error.response?.data?.error;
    const isRateLimitConflict = (
      error.response?.status === 409
      && Boolean(
        error.response?.data?.retryAfter
        || /too many requests|too many login attempts/i.test(`${rawResponseMessage || ''} ${rawResponseError || ''}`)
      )
    );

    if (error.response?.data && typeof error.response.data === 'object') {
      localizeBackendPayload(error.response.data);
    }

    if (error.response?.status === 429 || isRateLimitConflict) {
      const retryAfterFromBody = error.response?.data?.retryAfter;
      const retryAfterFromHeader = error.response.headers['retry-after'] ||
        error.response.headers['Retry-After'] ||
        error.response.headers['RateLimit-Reset'];
      const retryAfter = retryAfterFromBody || (retryAfterFromHeader ? parseInt(retryAfterFromHeader, 10) : null);
      const retryAfterSeconds = retryAfter || 60;

      const retryMessage = getLocalizedRateLimitMessage(retryAfter ? retryAfterSeconds : null);

      showError(retryMessage);

      const rateLimitError = new Error(retryMessage);
      rateLimitError.response = error.response;
      rateLimitError.isRateLimit = true;
      rateLimitError.retryAfter = retryAfterSeconds;
      rateLimitError.message = retryMessage;

      return Promise.reject(rateLimitError);
    }

    const responseCode = error.response?.data?.code;
    const isSessionFailure = error.response?.status === 401 || (
      error.response?.status === 403 && SESSION_ENDING_CODES.has(responseCode)
    );

    if (isSessionFailure) {
      if (isPublicAuthRequest(originalRequest.url) || originalRequest.skipAuthRedirect) {
        return Promise.reject(error);
      }

      if (SESSION_ENDING_CODES.has(responseCode) || originalRequest._retry) {
        return Promise.reject(endSession(error.response.data?.message));
      }

      originalRequest._retry = true;

      const retryWithToken = (token) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      };

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(retryWithToken);
      }

      isRefreshing = true;
      const refreshResult = await refreshAccessToken();
      isRefreshing = false;

      if (refreshResult.success) {
        processQueue(null, refreshResult.accessToken);
        return retryWithToken(refreshResult.accessToken);
      }

      // A network failure is not a reason to sign the user out.
      const failure = refreshResult.transient ? error : endSession(refreshResult.error);
      processQueue(failure, null);
      return Promise.reject(failure);
    }

    return Promise.reject(error);
  }
);

export const isRateLimitError = (error) => {
  return error?.isRateLimit || error?.response?.status === 429;
};

export const getRateLimitMessage = (error) => {
  if (!isRateLimitError(error)) {
    return null;
  }

  const retryAfter = error.retryAfter ||
    (error.response?.headers && (
      parseInt(error.response.headers['retry-after'], 10) ||
      parseInt(error.response.headers['Retry-After'], 10)
    ));

  return getLocalizedRateLimitMessage(retryAfter || null);
};

export const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return true;
  }

  if (!payload.exp) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 5 * 60;
  return payload.exp < (currentTime + bufferTime);
};

export const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    return { success: false, error: translateBackendMessage('No refresh token available') };
  }

  if (isTokenExpired(refreshToken)) {
    clearStoredAuthSession({ preserveOrganization: true });
    return { success: false, error: translateBackendMessage('Refresh token expired') };
  }

  try {
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data?.success && response.data.data?.accessToken) {
      setStoredAccessToken(response.data.data.accessToken);

      if (response.data.data.organization) {
        setStoredOrganization(response.data.data.organization);
      }

      return {
        success: true,
        accessToken: response.data.data.accessToken,
        organization: response.data.data.organization || null
      };
    }

    return { success: false, error: translateBackendMessage('Invalid response from server') };
  } catch (error) {
    const status = error.response?.status;

    if (status !== 401 && status !== 403) {
      return {
        success: false,
        transient: true,
        error: translateBackendMessage('Unable to connect to the server. Check your connection and try again.')
      };
    }

    clearStoredAuthSession({ preserveOrganization: true });

    return {
      success: false,
      code: error.response?.data?.code,
      error: translateBackendMessage(error.response?.data?.message || 'Token refresh failed')
    };
  }
};

export default api;
