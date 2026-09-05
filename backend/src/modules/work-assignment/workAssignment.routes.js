'use strict';

const express = require('express');
const router = express.Router();

const {
  createAssignment, bulkAssign, getAssignments, getMyAssignments,
  updateStatus, editAssignment, deleteAssignment, getTimeline,
  getBatchesReady, getAssignmentStats
} = require('./workAssignment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.use(authenticate);

// Admin routes (expanded to include User role based on user request)
router.get('/batches-ready', requireRole('Admin', 'HO', 'SPV', 'User'), getBatchesReady);
router.get('/stats', requireRole('Admin', 'HO', 'SPV', 'User'), getAssignmentStats);
router.get('/', requireRole('Admin', 'HO', 'SPV', 'User'), getAssignments);
router.post('/', requireRole('Admin', 'HO', 'SPV', 'User'), createAssignment);
router.post('/bulk', requireRole('Admin', 'HO', 'SPV', 'User'), bulkAssign);
router.put('/:id', requireRole('Admin', 'HO', 'SPV', 'User'), editAssignment);
router.delete('/:id', requireRole('Admin', 'HO', 'SPV', 'User'), deleteAssignment);
router.get('/:id/timeline', getTimeline);

// Inspector routes (any authenticated user can see their own + update status)
router.get('/my', getMyAssignments);
router.put('/:id/status', updateStatus);

module.exports = router;
