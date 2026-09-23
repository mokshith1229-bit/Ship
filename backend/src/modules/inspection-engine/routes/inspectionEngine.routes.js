'use strict';

const express = require('express');
const router = express.Router();
const inspectionEngineController = require('../controllers/inspectionEngine.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');

router.use(authenticate);

// Create a new Inspection Batch
router.post('/batches', requirePermission('Inspection Engine', 'create'), inspectionEngineController.createBatch);

// Preview a Roadway Continuous Sampling Batch
router.post('/roadway-preview', requirePermission('Inspection Engine', 'view'), inspectionEngineController.previewRoadwayBatch);

// Create a Roadway Continuous Sampling Batch
router.post('/roadway', requirePermission('Inspection Engine', 'create'), inspectionEngineController.createRoadwayBatch);

// List all Inspection Batches
router.get('/batches', requirePermission('Inspection Engine', 'view'), inspectionEngineController.listBatches);

// Get details of a specific Inspection Batch
router.get('/batches/:id', requirePermission('Inspection Engine', 'view'), inspectionEngineController.getBatchDetails);

// Delete an Inspection Batch
router.delete('/batches/:id', requirePermission('Inspection Engine', 'delete'), inspectionEngineController.deleteBatch);

// Get Extraction Debug Report
router.get('/batches/:id/extraction-report', requirePermission('Inspection Engine', 'view'), inspectionEngineController.getExtractionReport);

module.exports = router;
