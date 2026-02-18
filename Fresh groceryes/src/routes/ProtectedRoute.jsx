import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { buildReturnToLocation, isAuthenticatedUser } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const authState = useSelector((state) => state.auth);
  const canAccess = isAuthenticatedUser(authState);

  if (!canAccess) {
    // Redirect to login page with the current location to come back after login
    return <Navigate to="/login" state={{ from: buildReturnToLocation(location) }} replace />;
  }

  return children;
};

export default ProtectedRoute;
