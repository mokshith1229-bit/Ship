'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../../../middleware/auth.middleware');
const projectFacilitiesController = require('../controllers/projectFacilities.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Protect all routes
router.use(authenticate);

router.post('/parse', upload.single('file'), projectFacilitiesController.parseExcel);
router.post('/generate', projectFacilitiesController.generateBatch);

module.exports = router;
