'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const surveyProcessingController = require('../controllers/surveyProcessing.controller');

router.use(authenticate);

// Get all batches waiting for images
router.get('/batches', requirePermission('Survey Processing', 'view'), surveyProcessingController.getPendingBatches);

// Extract images for a project
router.post('/extract/:project', requirePermission('Survey Processing', 'create'), surveyProcessingController.extractImages);

module.exports = router;
