import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { isTokenExpired, refreshAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate and refresh tokens on app startup
    const validateAndRefreshTokens = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      // If no tokens at all, user is not logged in
      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      // If we have a user but no access token, try to refresh
      if (storedUser && !accessToken && refreshToken) {
        const result = await refreshAccessToken();
        if (result.success) {
          // Token refreshed successfully, set user
          setUser(JSON.parse(storedUser));
        } else {
          // Refresh failed, clear everything
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
        }
        setLoading(false);
        return;
      }

      // If we have access token, check if it's expired
      if (accessToken) {
        if (isTokenExpired(accessToken)) {
          // Access token is expired, try to refresh
          if (refreshToken && !isTokenExpired(refreshToken)) {
            // Refresh token is still valid, refresh access token
            const result = await refreshAccessToken();
            if (result.success) {
              // Token refreshed successfully, set user
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              }
            } else {
              // Refresh failed, clear everything
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } else {
            // Refresh token is also expired or doesn't exist, clear everything
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } else {
          // Access token is still valid, set user
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      }

      setLoading(false);
    };

    validateAndRefreshTokens();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setUser(user);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
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

