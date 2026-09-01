const mockFeatures = [
  { featureId: 'f16', featureName: 'Role', featureType: 'Module', moduleName: 'Role' },
  { featureId: 'f16-s1', featureName: 'Permissions', featureType: 'Section', parentFeature: 'f16' },
  { featureId: 'f15', featureName: 'Users', featureType: 'Module', moduleName: 'Users' },
  { featureId: 'f15-s1', featureName: 'User List', featureType: 'Section', parentFeature: 'f15' },
  { featureId: 'f14', featureName: 'Notifications', featureType: 'Module', moduleName: 'Notifications' },
  { featureId: 'f14-s1', featureName: 'Alerts', featureType: 'Section', parentFeature: 'f14' },
  { featureId: 'f13', featureName: 'Reports', featureType: 'Module', moduleName: 'Reports' },
  { featureId: 'f13-s1', featureName: 'Generated Reports', featureType: 'Section', parentFeature: 'f13' },
  { featureId: 'f12', featureName: 'SHIP', featureType: 'Module', moduleName: 'SHIP' },
  { featureId: 'f12-s1', featureName: 'Analytics', featureType: 'Section', parentFeature: 'f12' },
  { featureId: 'f11', featureName: 'Rating', featureType: 'Module', moduleName: 'Rating' },
  { featureId: 'f11-s1', featureName: 'Ratings', featureType: 'Section', parentFeature: 'f11' },
  { featureId: 'f10', featureName: 'Image Review', featureType: 'Module', moduleName: 'Image' },
  { featureId: 'f10-s1', featureName: 'Gallery', featureType: 'Section', parentFeature: 'f10' },
  { featureId: 'f9', featureName: 'Survey Processing', featureType: 'Module', moduleName: 'Processing' },
  { featureId: 'f9-s1', featureName: 'Jobs', featureType: 'Section', parentFeature: 'f9' },
  { featureId: 'f8', featureName: 'Survey Library', featureType: 'Module', moduleName: 'Library' },
  { featureId: 'f8-s1', featureName: 'Surveys', featureType: 'Section', parentFeature: 'f8' },
  { featureId: 'f7', featureName: 'ATMS', featureType: 'Module', moduleName: 'ATMS' },
  { featureId: 'f7-s1', featureName: 'Settings', featureType: 'Section', parentFeature: 'f7' },
  { featureId: 'f6', featureName: 'Project Facilities', featureType: 'Module', moduleName: 'Facilities' },
  { featureId: 'f6-s1', featureName: 'Projects', featureType: 'Section', parentFeature: 'f6' },
  { featureId: 'f5', featureName: 'Structures Sampling', featureType: 'Module', moduleName: 'Structures' },
  { featureId: 'f5-s1', featureName: 'Samples', featureType: 'Section', parentFeature: 'f5' },
  { featureId: 'f4', featureName: 'Roadway Sampling', featureType: 'Module', moduleName: 'Roadway' },
  { featureId: 'f4-s1', featureName: 'Samples', featureType: 'Section', parentFeature: 'f4' },
  { featureId: 'f3', featureName: 'Inspection Engine', featureType: 'Module', moduleName: 'Inspection' },
  { featureId: 'f3-s1', featureName: 'Settings', featureType: 'Section', parentFeature: 'f3' },
  { featureId: 'f2', featureName: 'Master List', featureType: 'Module', moduleName: 'Master List' },
  { featureId: 'f2-s1', featureName: 'Roads', featureType: 'Section', parentFeature: 'f2' },
  { featureId: 'f1', featureName: 'Dashboard', featureType: 'Module', moduleName: 'Dashboard' },
  { featureId: 'f1-s1', featureName: 'Overview', featureType: 'Section', parentFeature: 'f1' },
];

const mockPermissions = [
  { _id: 'p1', featureId: 'f1-s1', roleId: 'Admin', permissions: { view: true, create: true, edit: true, delete: true, export: true } },
  { _id: 'p2', featureId: 'f1-s1', roleId: 'SPV', permissions: { view: true, create: false, edit: false, delete: false, export: true } },
  { _id: 'p3', featureId: 'f1-s1', roleId: 'User', permissions: { view: true, create: false, edit: false, delete: false, export: false } },
  { _id: 'p4', featureId: 'f2-s1', roleId: 'Admin', permissions: { view: true, create: true, edit: true, delete: true, export: true } },
  { _id: 'p5', featureId: 'f2-s1', roleId: 'SPV', permissions: { view: true, create: false, edit: false, delete: false, export: true } },
  { _id: 'p6', featureId: 'f2-s1', roleId: 'User', permissions: { view: false, create: false, edit: false, delete: false, export: false } },
  { _id: 'p7', featureId: 'f3-s1', roleId: 'Admin', permissions: { view: true, create: true, edit: true, delete: true, export: true } },
  { _id: 'p8', featureId: 'f3-s1', roleId: 'SPV', permissions: { view: true, create: false, edit: false, delete: false, export: false } },
  { _id: 'p9', featureId: 'f3-s1', roleId: 'User', permissions: { view: false, create: false, edit: false, delete: false, export: false } },
  { _id: 'p10', featureId: 'f3-s2', roleId: 'Admin', permissions: { view: true, create: true, edit: true, delete: true, export: true } },
  { _id: 'p11', featureId: 'f3-s2', roleId: 'SPV', permissions: { view: true, create: false, edit: false, delete: false, export: false } },
  { _id: 'p12', featureId: 'f3-s2', roleId: 'User', permissions: { view: false, create: false, edit: false, delete: false, export: false } },
];

export const roleService = {
  getFeatures: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: mockFeatures };
  },
  getRolePermissions: async (role) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const data = mockPermissions.filter(p => p.roleId === role);
    return { success: true, data };
  },
  getPermissionHistory: async (featureId) => {
    return { success: true, data: [] };
  },
  updateRolePermission: async (permId, permissions) => {
    return { success: true };
  }
};
