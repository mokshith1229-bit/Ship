import React, { createContext, useState, useEffect, useCallback } from 'react';
import { roleService } from '../services/role.service';

export const AuthContext = createContext();
export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_permissions');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const fetchPermissions = useCallback(async (roleName) => {
    if (!roleName) {
      setUserPermissions({});
      localStorage.removeItem('cached_permissions');
      return;
    }

    // Admin and Administrator have full access by default
    if (roleName === 'Admin' || roleName === 'Administrator') {
      const fullPerms = {};
      const full = { view: true, create: true, edit: true, delete: true, export: true };
      const commonModules = [
        'Dashboard', 'Master List', 'Inspection Engine', 'Roadway Sampling',
        'Structures Sampling', 'Project Facilities', 'ATMS', 'Survey Library',
        'Survey Processing', 'Image Review', 'Rating', 'Rating V2', 'SHIP',
        'Reports', 'Notifications', 'Users', 'User Insights', 'Role'
      ];
      commonModules.forEach(m => {
        fullPerms[m] = full;
        fullPerms[m.toLowerCase()] = full;
      });
      setUserPermissions(fullPerms);
      localStorage.setItem('cached_permissions', JSON.stringify(fullPerms));
      return;
    }

    try {
      const res = await roleService.getMyPermissions();
      if (res.success && res.data && Object.keys(res.data).length > 0) {
        setUserPermissions(res.data);
        localStorage.setItem('cached_permissions', JSON.stringify(res.data));
      } else {
        // Fallback: fetch role permissions and features directly
        const [featRes, roleRes] = await Promise.all([
          roleService.getFeatures(),
          roleService.getRolePermissions(roleName)
        ]);
        const featList = featRes.data || [];
        const permList = roleRes.data || [];
        const featMap = {};
        featList.forEach(f => { featMap[f.featureId] = f; });

        const perms = {};
        // Assign non-module / section permissions first
        permList.forEach(rp => {
          const feat = featMap[rp.featureId];
          perms[rp.featureId] = rp.permissions;
          if (feat && feat.featureType !== 'Module') {
            perms[feat.featureName] = rp.permissions;
            perms[feat.featureName.toLowerCase()] = rp.permissions;
          }
        });

        // Assign module permissions to ensure moduleName takes precedence
        permList.forEach(rp => {
          const feat = featMap[rp.featureId];
          if (feat && feat.featureType === 'Module') {
            perms[feat.moduleName] = rp.permissions;
            perms[feat.moduleName.toLowerCase()] = rp.permissions;
            perms[feat.featureName] = rp.permissions;
            perms[feat.featureName.toLowerCase()] = rp.permissions;
            perms[rp.featureId] = rp.permissions;
          }
        });

        setUserPermissions(perms);
        localStorage.setItem('cached_permissions', JSON.stringify(perms));
      }
    } catch (err) {
      console.error('Failed to load user permissions in AuthContext:', err);
    }
  }, []);

  useEffect(() => {
    // Restore session on refresh
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      setIsAuthenticated(true);
      fetchPermissions(parsedUser.role);
    }
    setLoading(false);
  }, [fetchPermissions]);

  useEffect(() => {
    const handlePermissionsUpdated = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          fetchPermissions(parsed.role);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('permissions-updated', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);
    return () => {
      window.removeEventListener('permissions-updated', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
    };
  }, [fetchPermissions]);

  const login = (jwtToken, userData) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    setIsAuthenticated(true);
    fetchPermissions(userData.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cached_permissions');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setUserPermissions({});
  };

  /**
   * Helper to check if the current user has permission for a module/action
   * @param {string} moduleOrFeatureName - e.g. 'Users', 'User Insights', 'Rating'
   * @param {'view'|'create'|'edit'|'delete'|'export'} action - action name (default 'view')
   */
  const hasPermission = useCallback((moduleOrFeatureName, action = 'view') => {
    if (!user) return false;
    if (user.role === 'Admin' || user.role === 'Administrator') return true;

    if (!userPermissions || Object.keys(userPermissions).length === 0) {
      return false;
    }

    const target = (moduleOrFeatureName || '').trim().toLowerCase();

    // Look for exact key match first
    if (userPermissions[target]) {
      return userPermissions[target][action] === true;
    }
    if (userPermissions[moduleOrFeatureName]) {
      return userPermissions[moduleOrFeatureName][action] === true;
    }

    // Look for normalized key match
    const foundKey = Object.keys(userPermissions).find(k => {
      const normalizedK = k.trim().toLowerCase();
      return (
        normalizedK === target ||
        normalizedK.replace(/s$/i, '') === target.replace(/s$/i, '') ||
        normalizedK.replace(/[-_ ]/g, '') === target.replace(/[-_ ]/g, '')
      );
    });

    if (foundKey && userPermissions[foundKey]) {
      return userPermissions[foundKey][action] === true;
    }

    return false;
  }, [user, userPermissions]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      login,
      logout,
      loading,
      userPermissions,
      hasPermission,
      refreshPermissions: () => user && fetchPermissions(user.role)
    }}>
      {children}
    </AuthContext.Provider>
  );
};
