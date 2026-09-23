'use strict';

const Feature = require('../../models/Feature.model');
const RolePermission = require('../../models/RolePermission.model');
const PermissionHistory = require('../../models/PermissionHistory.model');
const asyncHandler = require('../../utils/asyncHandler.util');
const { successResponse, errorResponse } = require('../../utils/response.util');

// ==========================================
// FEATURES
// ==========================================

exports.getFeatures = asyncHandler(async (req, res) => {
  const features = await Feature.find({ status: true }).sort({ order: 1, createdAt: 1 });
  
  // Deduplicate features by featureId
  const uniqueFeatures = [];
  const seen = new Set();
  for (const f of features) {
    if (!seen.has(f.featureId)) {
      seen.add(f.featureId);
      uniqueFeatures.push(f);
    }
  }

  return successResponse(res, uniqueFeatures, 'Features retrieved successfully');
});

exports.createFeature = asyncHandler(async (req, res) => {
  const { featureId, featureName, featureType, moduleName, parentFeature, order, status } = req.body;

  const existingFeature = await Feature.findOne({ featureId });
  if (existingFeature) {
    return errorResponse(res, 'Feature with this ID already exists', [], 400);
  }

  const feature = await Feature.create({
    featureId,
    featureName,
    featureType,
    moduleName,
    parentFeature: parentFeature || null,
    order: order || 0,
    status: status !== undefined ? status : true
  });

  return successResponse(res, feature, 'Feature created successfully', 201);
});

// ==========================================
// ROLE PERMISSIONS
// ==========================================

exports.getRolePermissions = asyncHandler(async (req, res) => {
  const { id: roleId } = req.params;
  
  const query = roleId && roleId !== 'all' ? { roleId } : {};
  const permissions = await RolePermission.find(query);
  
  // Deduplicate by roleId + featureId
  const uniquePermissions = [];
  const seen = new Set();
  for (const p of permissions) {
    const key = `${p.roleId}_${p.featureId}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePermissions.push(p);
    }
  }

  return successResponse(res, uniquePermissions, `Permissions retrieved successfully`);
});

exports.getMyPermissions = asyncHandler(async (req, res) => {
  const role = req.user ? req.user.role : 'User';

  const [features, rolePermissions] = await Promise.all([
    Feature.find({ status: true }),
    RolePermission.find({ roleId: new RegExp(`^${role}$`, 'i') })
  ]);

  const perms = {};

  if (role === 'Admin' || role === 'Administrator') {
    features.forEach(f => {
      const full = { view: true, create: true, edit: true, delete: true, export: true };
      perms[f.featureId] = full;
      perms[f.featureId.toLowerCase()] = full;
      perms[f.moduleName] = full;
      perms[f.moduleName.toLowerCase()] = full;
      perms[f.featureName] = full;
      perms[f.featureName.toLowerCase()] = full;
    });
    return successResponse(res, perms, 'Admin permissions retrieved successfully');
  }

  const featureMap = {};
  features.forEach(f => {
    featureMap[f.featureId] = f;
  });

  // Assign Section / action permissions first
  rolePermissions.forEach(rp => {
    const feat = featureMap[rp.featureId];
    perms[rp.featureId] = rp.permissions;
    perms[rp.featureId.toLowerCase()] = rp.permissions;
    if (feat && feat.featureType !== 'Module') {
      perms[feat.featureName] = rp.permissions;
      perms[feat.featureName.toLowerCase()] = rp.permissions;
    }
  });

  // Assign Module permissions so moduleName and module featureName take precedence
  rolePermissions.forEach(rp => {
    const feat = featureMap[rp.featureId];
    if (feat && feat.featureType === 'Module') {
      perms[feat.moduleName] = rp.permissions;
      perms[feat.moduleName.toLowerCase()] = rp.permissions;
      perms[feat.featureName] = rp.permissions;
      perms[feat.featureName.toLowerCase()] = rp.permissions;
      perms[rp.featureId] = rp.permissions;
      perms[rp.featureId.toLowerCase()] = rp.permissions;
    }
  });

  return successResponse(res, perms, 'Permissions retrieved successfully');
});

exports.createRolePermission = asyncHandler(async (req, res) => {
  const { roleId, featureId, permissions } = req.body;

  const existingPermission = await RolePermission.findOne({ roleId, featureId });
  if (existingPermission) {
    return errorResponse(res, 'Permission for this role and feature already exists', [], 400);
  }

  const rolePermission = await RolePermission.create({
    roleId,
    featureId,
    permissions: permissions || { view: false, create: false, edit: false, delete: false, export: false }
  });

  // Log history
  await PermissionHistory.create({
    roleId,
    featureId,
    changedBy: req.user ? (req.user.name || req.user.email) : 'Admin',
    oldPermission: null,
    newPermission: rolePermission.permissions
  });

  return successResponse(res, rolePermission, 'Role permission created successfully', 201);
});

exports.updateRolePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions, roleId, featureId } = req.body;

  let rolePermission = null;

  // Try finding by MongoDB _id first
  if (id && id !== 'undefined' && id.match(/^[0-9a-fA-F]{24}$/)) {
    rolePermission = await RolePermission.findById(id);
  }

  // Fallback to roleId + featureId
  if (!rolePermission && (roleId && featureId)) {
    rolePermission = await RolePermission.findOne({ roleId, featureId });
  }

  if (!rolePermission) {
    // If not found, upsert a new permission record
    if (roleId && featureId) {
      rolePermission = await RolePermission.create({
        roleId,
        featureId,
        permissions: permissions || { view: false, create: false, edit: false, delete: false, export: false }
      });

      await PermissionHistory.create({
        roleId,
        featureId,
        changedBy: req.user ? (req.user.name || req.user.email) : 'Admin',
        oldPermission: null,
        newPermission: rolePermission.permissions
      });

      return successResponse(res, rolePermission, 'Role permission created successfully');
    }
    return errorResponse(res, 'Role permission not found', [], 404);
  }

  const oldPermission = { ...(rolePermission.permissions ? rolePermission.permissions.toObject() : {}) };
  
  if (permissions) {
    rolePermission.permissions = {
      ...oldPermission,
      ...permissions
    };
  }

  await rolePermission.save();

  // Log history
  await PermissionHistory.create({
    roleId: rolePermission.roleId,
    featureId: rolePermission.featureId,
    changedBy: req.user ? (req.user.name || req.user.email) : 'Admin',
    oldPermission: oldPermission,
    newPermission: rolePermission.permissions.toObject()
  });

  return successResponse(res, rolePermission, 'Role permission updated successfully');
});

// Bulk update permissions
exports.bulkUpdatePermissions = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return errorResponse(res, 'Updates array is required', [], 400);
  }

  const updatedRecords = [];
  const changedBy = req.user ? (req.user.name || req.user.email) : 'Admin';

  for (const update of updates) {
    let rolePerm = null;
    if (update._id && update._id.match(/^[0-9a-fA-F]{24}$/)) {
      rolePerm = await RolePermission.findById(update._id);
    }
    if (!rolePerm && update.roleId && update.featureId) {
      rolePerm = await RolePermission.findOne({ roleId: update.roleId, featureId: update.featureId });
    }

    if (rolePerm) {
      const oldPermission = { ...(rolePerm.permissions ? rolePerm.permissions.toObject() : {}) };
      rolePerm.permissions = {
        ...oldPermission,
        ...update.permissions
      };
      await rolePerm.save();

      await PermissionHistory.create({
        roleId: rolePerm.roleId,
        featureId: rolePerm.featureId,
        changedBy,
        oldPermission,
        newPermission: rolePerm.permissions.toObject()
      });

      updatedRecords.push(rolePerm);
    } else if (update.roleId && update.featureId) {
      const newPerm = await RolePermission.create({
        roleId: update.roleId,
        featureId: update.featureId,
        permissions: update.permissions
      });

      await PermissionHistory.create({
        roleId: update.roleId,
        featureId: update.featureId,
        changedBy,
        oldPermission: null,
        newPermission: newPerm.permissions.toObject()
      });

      updatedRecords.push(newPerm);
    }
  }

  return successResponse(res, updatedRecords, `${updatedRecords.length} permissions updated successfully`);
});

// ==========================================
// HISTORY
// ==========================================

exports.getPermissionHistory = asyncHandler(async (req, res) => {
  const { roleId, featureId } = req.query;
  const filter = {};
  
  if (roleId) filter.roleId = roleId;
  if (featureId) filter.featureId = featureId;

  const history = await PermissionHistory.find(filter).sort({ changedAt: -1 }).limit(50);
  
  return successResponse(res, history, 'Permission history retrieved successfully');
});
