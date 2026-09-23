import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MdLockOutline, MdArrowBack, MdHome } from 'react-icons/md';

const ProtectedRoute = ({ children, allowedRoles, moduleName, action = 'view' }) => {
  const { user, isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
  } else if (moduleName) {
    hasAccess = hasPermission(moduleName, action);
  } else if (allowedRoles && Array.isArray(allowedRoles)) {
    hasAccess = allowedRoles.includes(user.role);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-100">
          <MdLockOutline />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">403 - Access Denied</h1>
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          Restricted {moduleName || 'Page'} Access
        </h2>
        <p className="text-gray-500 mb-6 max-w-md text-sm">
          Your account role (<strong className="text-gray-700">{user?.role}</strong>) does not have {action} permission for this resource. Please contact your system administrator.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <MdArrowBack className="text-base" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
          >
            <MdHome className="text-base" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
