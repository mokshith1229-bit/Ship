'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllProjects, getStatusDistribution, getProjectByCode,
  getProjectById, getProjectStats, createProject, updateProject, completeProject
} = require('./project.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.use(authenticate);

router.get('/', getAllProjects);
router.get('/status-distribution', getStatusDistribution);
router.get('/code/:code', getProjectByCode);
router.patch('/code/:code/complete', completeProject);
router.get('/:id/stats', getProjectStats);
router.get('/:id', getProjectById);
router.post('/', requireRole('Admin'), createProject);
router.put('/:id', requireRole('Admin'), updateProject);

module.exports = router;
