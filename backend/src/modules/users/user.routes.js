'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllUsers, getUserStats, getUserById,
  createUser, updateUser, toggleUserStatus, deleteUser,
  getUserDashboard
} = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');

// All user routes require authentication
router.use(authenticate);

router.get('/dashboard', getUserDashboard);
router.get('/stats', requirePermission('Users', 'view'), getUserStats);
router.get('/', requirePermission('Users', 'view'), getAllUsers);
router.get('/:id', requirePermission('Users', 'view'), getUserById);
router.post('/', requirePermission('Users', 'create'), createUser);
router.put('/:id/status', requirePermission('Users', 'edit'), toggleUserStatus);
router.put('/:id', requirePermission('Users', 'edit'), updateUser);
router.delete('/:id', requirePermission('Users', 'delete'), deleteUser);

module.exports = router;
