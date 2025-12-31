import axios from 'axios';
import { showError } from './toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Track if token refresh is in progress to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout (reduced from 60s for better performance)
  headers: {
    'Content-Type': 'application/json',
  },
  // Performance optimizations
  maxRedirects: 5,
  validateStatus: (status) => {
    // Allow 2xx and 3xx, but treat 401 as error for token refresh handling
    // Other 4xx errors are also treated as errors
    return (status >= 200 && status < 300) || (status >= 300 && status < 400);
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Too Many Requests (Rate Limiting) or 409 Conflict (sometimes used for rate limiting)
    if (error.response?.status === 429 || error.response?.status === 409) {
      // Try to get retryAfter from response body first, then headers
      const retryAfterFromBody = error.response?.data?.retryAfter;
      const retryAfterFromHeader = error.response.headers['retry-after'] ||
        error.response.headers['Retry-After'] ||
        error.response.headers['RateLimit-Reset'];
      const retryAfter = retryAfterFromBody || (retryAfterFromHeader ? parseInt(retryAfterFromHeader) : null);
      const retryAfterSeconds = retryAfter || 60;

      // Format retry message
      let retryMessage = 'Too many requests. Please wait a moment before trying again.';
      if (retryAfter) {
        if (retryAfterSeconds < 60) {
          retryMessage = `Too many requests. Please wait ${retryAfterSeconds} second${retryAfterSeconds > 1 ? 's' : ''} before trying again.`;
        } else {
          const minutes = Math.floor(retryAfterSeconds / 60);
          retryMessage = `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
        }
      }

      // Show error toast notification
      showError(retryMessage);

      // Create a user-friendly error object
      const rateLimitError = new Error(retryMessage);
      rateLimitError.response = error.response;
      rateLimitError.isRateLimit = true;
      rateLimitError.retryAfter = retryAfterSeconds;
      rateLimitError.message = retryMessage;

      return Promise.reject(rateLimitError);
    }

    // Handle 401 Unauthorized (Token refresh or redirect to login)
    if (error.response?.status === 401) {
      // Get the request URL (could be relative or absolute)
      const requestUrl = originalRequest.url || originalRequest.baseURL + originalRequest.url || '';

      // Skip token refresh for login/refresh endpoints to avoid infinite loops
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/register');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      // Prevent multiple refresh attempts
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Try to refresh the token using a direct axios call to avoid interceptor loop
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.data && response.data.success && response.data.data?.accessToken) {
            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);

            // Process queued requests
            processQueue(null, accessToken);
            isRefreshing = false;

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            // Reset retry flag for the retry
            originalRequest._retry = false;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed or doesn't exist
        console.log('Token refresh failed:', refreshError.response?.data || refreshError.message);
        processQueue(refreshError, null);
        isRefreshing = false;
      }

      // No refresh token or refresh failed - redirect to login
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Show user-friendly message
      const errorMessage = error.response?.data?.message || 'Your session has expired';
      if (errorMessage === 'Token is not valid' ||
        errorMessage.includes('expired') ||
        errorMessage.includes('not valid') ||
        errorMessage === 'Not authorized to access this route') {
        showError('Your session has expired. Please log in again.');
      } else {
        showError('Authentication failed. Please log in again.');
      }

      // Redirect to login after a short delay to show the message
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);

      return Promise.reject(new Error('Session expired'));
    }

    return Promise.reject(error);
  }
);

// Helper function to check if an error is a rate limit error
export const isRateLimitError = (error) => {
  return error?.isRateLimit || error?.response?.status === 429;
};

// Helper function to get rate limit error message
export const getRateLimitMessage = (error) => {
  if (!isRateLimitError(error)) return null;

  const retryAfter = error.retryAfter ||
    (error.response?.headers && (
      parseInt(error.response.headers['retry-after']) ||
      parseInt(error.response.headers['Retry-After'])
    ));

  if (retryAfter) {
    if (retryAfter < 60) {
      return `Too many requests. Please wait ${retryAfter} second${retryAfter > 1 ? 's' : ''} before trying again.`;
    } else {
      const minutes = Math.floor(retryAfter / 60);
      return `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
    }
  }

  return 'Too many requests. Please wait a moment before trying again.';
};

// Utility function to decode JWT token and check expiration (without verification)
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has expiration
    if (!payload.exp) return false; // No expiration means it doesn't expire

    // Check if token is expired (with 5 minute buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes in seconds
    return payload.exp < (currentTime + bufferTime);
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // If we can't decode, consider it expired
  }
};

// Function to proactively refresh token (can be called from AuthContext)
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  // Check if refresh token is expired
  if (isTokenExpired(refreshToken)) {
    // Clear all tokens if refresh token is expired
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { success: false, error: 'Refresh token expired' };
  }

  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.success && response.data.data?.accessToken) {
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      return { success: true, accessToken };
    }

    return { success: false, error: 'Invalid response from server' };
  } catch (error) {
    console.error('Token refresh failed:', error);

    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Token refresh failed'
    };
  }
};

export default api;

