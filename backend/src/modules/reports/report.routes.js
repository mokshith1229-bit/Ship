'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/config', reportController.getConfig);
router.get('/assets', reportController.getAssetTypes);
router.get('/summary', reportController.getSummary);
router.get('/strip-chart', reportController.getStripChartData);
router.get('/generate', reportController.generateReport);
router.get('/generate-pdf', reportController.generatePdfReport);
router.get('/generate-comparison-pdf', reportController.generateComparisonPdfReport);
router.get('/overview-strip-chart', reportController.getOverviewStripChartData);

// ─── Asset Performance & Decision Center ────────────────────────────────────
router.get('/performance-center', reportController.getPerformanceCenterData);
router.get('/performance-center/records', reportController.getPerformanceRecords);
router.get('/generate-management-pdf', reportController.generateManagementPdfReport);

module.exports = router;
