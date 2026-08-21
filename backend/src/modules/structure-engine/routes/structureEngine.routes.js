'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const structureEngineController = require('../controllers/structureEngine.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

// Configure multer for excel upload in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml') || file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Please upload only Excel file.'), false);
    }
  }
});

router.use(authenticate);

// Detect sheets
router.post('/detect-sheets', upload.single('file'), structureEngineController.detectSheets);

// Parse Excel and Preview
router.post('/parse', upload.single('file'), structureEngineController.parseExcel);

// Generate Structure Batch
router.post('/generate', structureEngineController.generateBatch);

module.exports = router;
