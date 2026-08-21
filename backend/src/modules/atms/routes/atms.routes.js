'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../../../middleware/auth.middleware');
const atmsController = require('../controllers/atms.controller');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Protect all routes with auth middleware
router.use(authenticate);

// ATMS routes
router.post('/parse', upload.single('file'), atmsController.parseExcel);
router.post('/generate', atmsController.generateBatch);

module.exports = router;
