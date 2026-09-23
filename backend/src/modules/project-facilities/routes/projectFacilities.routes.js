'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const projectFacilitiesController = require('../controllers/projectFacilities.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Protect all routes
router.use(authenticate);

router.post('/parse', requirePermission('Project Facilities', 'create'), upload.single('file'), projectFacilitiesController.parseExcel);
router.post('/generate', requirePermission('Project Facilities', 'create'), projectFacilitiesController.generateBatch);

module.exports = router;
