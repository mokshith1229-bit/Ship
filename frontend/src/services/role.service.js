import api from './api';

export const roleService = {
  getFeatures: async () => {
    try {
      const response = await api.get('/roles/features');
      return response.data;
    } catch (error) {
      console.error('Error in getFeatures:', error);
      return { success: false, data: [] };
    }
  },

  getRolePermissions: async (roleId) => {
    try {
      const response = await api.get(`/roles/${roleId}/permissions`);
      return response.data;
    } catch (error) {
      console.error(`Error in getRolePermissions for ${roleId}:`, error);
      return { success: false, data: [] };
    }
  },

  getMyPermissions: async () => {
    try {
      const response = await api.get('/roles/my-permissions');
      return response.data;
    } catch (error) {
      console.error('Error in getMyPermissions:', error);
      return { success: false, data: {} };
    }
  },

  updateRolePermission: async (id, permissions, extra = {}) => {
    try {
      const payload = { permissions, ...extra };
      const response = await api.put(`/roles/permissions/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error in updateRolePermission:', error);
      throw error;
    }
  },

  bulkUpdatePermissions: async (updates) => {
    try {
      const response = await api.put('/roles/permissions/bulk', { updates });
      return response.data;
    } catch (error) {
      console.error('Error in bulkUpdatePermissions:', error);
      throw error;
    }
  },

  getPermissionHistory: async (featureId) => {
    try {
      const response = await api.get(`/roles/permission-history?featureId=${featureId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getPermissionHistory:', error);
      return { success: false, data: [] };
    }
  }
};
