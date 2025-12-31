import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Common/Loading';

const ProtectedRoute = ({ children, roles = [], allowedRoles = [], department = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // QR Manager can only access /qr page
  if (user.role === 'qr-manager') {
    // Allow access to /qr and /attend/:token (for scanning)
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/qr') || currentPath.startsWith('/attend/')) {
      return children;
    }
    // Redirect to /qr for any other route
    return <Navigate to="/qr" replace />;
  }

  // Support both 'roles' and 'allowedRoles' props for backward compatibility
  const requiredRoles = roles.length > 0 ? roles : allowedRoles;

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect qr-manager to /qr, others to dashboard
    const redirectTo = user.role === 'qr-manager' ? '/qr' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Check department requirement (e.g., only management admins can access templates)
  if (department && user.department !== department) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

