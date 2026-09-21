import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../services/auth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const authed = isAuthenticated();
  const user = getUser();

  if (!authed || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
