import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles, moduleName }) => {
  const { user, isAuthenticated, loading, userPermissions } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  let hasAccess = false;
  
  if (user?.role === 'Admin' || user?.role === 'Administrator') {
    hasAccess = true;
  } else if (moduleName && userPermissions) {
    if (userPermissions[moduleName]) {
      hasAccess = userPermissions[moduleName].view === true;
    } else {
      hasAccess = false;
    }
  } else if (allowedRoles) {
    hasAccess = allowedRoles.includes(user.role);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-6xl font-bold text-green-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6 max-w-md">You don't have permission to view this module. Please contact your administrator.</p>
        <button onClick={() => window.history.back()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Go Back</button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
