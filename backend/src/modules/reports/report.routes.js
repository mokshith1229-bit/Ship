'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');

router.use(authenticate);

router.get('/config', requirePermission('Reports', 'view'), reportController.getConfig);
router.get('/assets', requirePermission('Reports', 'view'), reportController.getAssetTypes);
router.get('/summary', requirePermission('Reports', 'view'), reportController.getSummary);
router.get('/strip-chart', requirePermission('Reports', 'view'), reportController.getStripChartData);
router.get('/generate', requirePermission('Reports', 'export'), reportController.generateReport);
router.get('/generate-pdf', requirePermission('Reports', 'export'), reportController.generatePdfReport);
router.get('/generate-comparison-pdf', requirePermission('Reports', 'export'), reportController.generateComparisonPdfReport);
router.get('/overview-strip-chart', requirePermission('Reports', 'view'), reportController.getOverviewStripChartData);

// ─── Asset Performance & Decision Center ────────────────────────────────────
router.get('/performance-center', requirePermission('Reports', 'view'), reportController.getPerformanceCenterData);
router.get('/performance-center/records', requirePermission('Reports', 'view'), reportController.getPerformanceRecords);
router.get('/generate-management-pdf', requirePermission('Reports', 'export'), reportController.generateManagementPdfReport);

module.exports = router;
