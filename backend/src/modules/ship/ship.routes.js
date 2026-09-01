'use strict';

const express = require('express');
const router = express.Router();
const shipController = require('./controllers/ship.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

// Phase 1 Analytics Endpoints
router.get('/overview', shipController.getOverview);
router.get('/projects', shipController.getProjects);
router.get('/assets', shipController.getAssets);
router.get('/categories', shipController.getCategories);
router.get('/ratings', shipController.getRatings);
router.get('/inspection', shipController.getInspection);
router.get('/users', shipController.getUsers);
router.get('/risk', shipController.getRisk);
router.get('/trends', shipController.getTrends);

module.exports = router;
