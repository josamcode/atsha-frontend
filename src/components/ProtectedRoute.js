import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Common/Loading';
import {
  buildLoginPath,
  getDefaultAuthenticatedPath,
  isQrManager,
  roleMatches
} from '../utils/organization';

const ProtectedRoute = ({ children, roles = [], allowedRoles = [] }) => {
  const location = useLocation();
  const { user, organization, organizationSlug, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!organization || !user) {
    return <Navigate to={buildLoginPath(location, organizationSlug)} replace />;
  }

  if (isQrManager(user)) {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/qr') || currentPath.startsWith('/attend/')) {
      return children;
    }

    return <Navigate to="/qr" replace />;
  }

  const requiredRoles = roles.length > 0 ? roles : allowedRoles;
  if (requiredRoles.length > 0 && !roleMatches(user, requiredRoles)) {
    return <Navigate to={getDefaultAuthenticatedPath(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;
