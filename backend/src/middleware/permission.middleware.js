'use strict';

const RolePermission = require('../models/RolePermission.model');
const Feature = require('../models/Feature.model');
const { errorResponse } = require('../utils/response.util');

/**
 * Middleware factory to check if logged-in user's role has permission for a feature.
 * @param {string} moduleOrFeature - moduleName or featureId (e.g., 'Users', 'User Insights', 'f15')
 * @param {string} action - 'view' | 'create' | 'edit' | 'delete' | 'export'
 */
const requirePermission = (moduleOrFeature, action = 'view') => {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', [], 401);
    }

    const role = req.user.role;

    // Admin and Administrator have full access to everything
    if (role === 'Admin' || role === 'Administrator') {
      return next();
    }

    try {
      const cleanTarget = (moduleOrFeature || '').trim();
      const strippedTarget = cleanTarget.replace(/s$/i, ''); // e.g. "Users" -> "User"

      // Find matching feature first (prioritize Module type)
      let feature = await Feature.findOne({
        $or: [
          { featureId: cleanTarget },
          { moduleName: new RegExp(`^${cleanTarget}$`, 'i'), featureType: 'Module' },
          { featureName: new RegExp(`^${cleanTarget}$`, 'i'), featureType: 'Module' }
        ]
      });

      if (!feature) {
        feature = await Feature.findOne({
          $or: [
            { moduleName: new RegExp(`^${cleanTarget}$`, 'i') },
            { featureName: new RegExp(`^${cleanTarget}$`, 'i') },
            { moduleName: new RegExp(`^${strippedTarget}$`, 'i') },
            { featureName: new RegExp(`^${strippedTarget}$`, 'i') }
          ]
        });
      }

      const featureId = feature ? feature.featureId : cleanTarget;

      const rolePermission = await RolePermission.findOne({
        roleId: new RegExp(`^${role}$`, 'i'),
        $or: [
          { featureId: featureId },
          { featureId: cleanTarget }
        ]
      });

      if (rolePermission && rolePermission.permissions && rolePermission.permissions[action] === true) {
        return next();
      }

      return errorResponse(
        res,
        `Access denied. Your role '${role}' does not have '${action}' permission for '${moduleOrFeature}'.`,
        [],
        403
      );
    } catch (err) {
      console.error('Permission check error:', err);
      return errorResponse(res, 'Authorization check failed.', [], 500);
    }
  };
};

module.exports = { requirePermission };
