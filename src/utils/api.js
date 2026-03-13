import axios from 'axios';
import { showError } from './toast';
import {
  getLocalizedAuthenticationFailedMessage,
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
  setStoredAccessToken,
  setStoredOrganization
} from './organization';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let failedQueue = [];

const getActiveOrganizationSlug = () => {
  return getResolvedOrganizationSlug({
    search: typeof window !== 'undefined' ? window.location.search : '',
    organization: getStoredOrganization(),
    fallbackSlug: getStoredOrganizationSlug()
  });
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

    if (error.response?.status === 401) {
      const requestUrl = originalRequest.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/register');

      if (isAuthEndpoint || originalRequest.skipAuthRedirect) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (!originalRequest.headers) {
              originalRequest.headers = {};
            }

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getStoredRefreshToken();
        const organizationSlug = getActiveOrganizationSlug();

        if (refreshToken) {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {
              refreshToken,
              organization: organizationSlug || undefined
            },
            {
              headers: {
                'Content-Type': 'application/json',
                ...buildOrganizationHeaders(organizationSlug)
              }
            }
          );

          if (response.data?.success && response.data.data?.accessToken) {
            const accessToken = response.data.data.accessToken;
            setStoredAccessToken(accessToken);

            if (response.data.data.organization) {
              setStoredOrganization(response.data.data.organization);
            }

            processQueue(null, accessToken);
            isRefreshing = false;

            if (!originalRequest.headers) {
              originalRequest.headers = {};
            }

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            originalRequest._retry = false;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
      }

      clearStoredAuthSession({ preserveOrganization: true });

      const errorMessage = rawResponseMessage || 'Your session has expired';
      if (
        errorMessage === 'Token is not valid' ||
        errorMessage.includes('expired') ||
        errorMessage.includes('not valid') ||
        errorMessage.includes('organization') ||
        errorMessage === 'Not authorized to access this route'
      ) {
        showError(getLocalizedSessionExpiredMessage());
      } else {
        showError(getLocalizedAuthenticationFailedMessage());
      }

      setTimeout(() => {
        const organizationSlug = getActiveOrganizationSlug();
        window.location.href = buildLoginPath(
          {
            pathname: window.location.pathname,
            search: window.location.search
          },
          organizationSlug
        );
      }, 1000);

      return Promise.reject(new Error('Session expired'));
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
    const organizationSlug = getActiveOrganizationSlug();
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      {
        refreshToken,
        organization: organizationSlug || undefined
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...buildOrganizationHeaders(organizationSlug)
        }
      }
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
    clearStoredAuthSession({ preserveOrganization: true });

    return {
      success: false,
      error: translateBackendMessage(error.response?.data?.message || error.message || 'Token refresh failed')
    };
  }
};

export default api;
