'use strict';

const express = require('express');
const router = express.Router();
const inspectionEngineController = require('../controllers/inspectionEngine.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

router.use(authenticate);

// Create a new Inspection Batch
router.post('/batches', inspectionEngineController.createBatch);

// List all Inspection Batches
router.get('/batches', inspectionEngineController.listBatches);

// Get details of a specific Inspection Batch
router.get('/batches/:id', inspectionEngineController.getBatchDetails);

// Delete an Inspection Batch
router.delete('/batches/:id', inspectionEngineController.deleteBatch);

// Get Extraction Debug Report
router.get('/batches/:id/extraction-report', inspectionEngineController.getExtractionReport);

module.exports = router;
