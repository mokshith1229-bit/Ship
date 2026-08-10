'use strict';

const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Protect all report routes
router.use(authenticate);

router.get('/spvs', reportsController.getSPVLeaderboard);
router.get('/spvs/:spvId/analytics', reportsController.getSPVAnalytics);

module.exports = router;
