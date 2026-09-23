'use strict';

const express = require('express');
const router = express.Router();
const roleController = require('./role.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// Feature routes
router.get('/features', roleController.getFeatures);
router.post('/features', authenticate, requireRole('Admin', 'Administrator'), roleController.createFeature);

// User specific mapped permissions
router.get('/my-permissions', authenticate, roleController.getMyPermissions);

// Permissions bulk update (place before /:id)
router.put('/permissions/bulk', roleController.bulkUpdatePermissions);

// Permissions CRUD
router.get('/:id/permissions', roleController.getRolePermissions);
router.post('/permissions', roleController.createRolePermission);
router.put('/permissions/:id', roleController.updateRolePermission);

// History
router.get('/permission-history', roleController.getPermissionHistory);

module.exports = router;
