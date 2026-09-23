'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const { uploadSurveyLibrary } = require('../../../middleware/upload.middleware');
const surveyLibraryController = require('../controllers/surveyLibrary.controller');

router.use(authenticate);

// Get project library assets
router.get('/:project', requirePermission('Survey Library', 'view'), surveyLibraryController.getAssets);

// Create new asset (must contain both video and vtt)
router.post(
  '/:project/asset',
  requirePermission('Survey Library', 'create'),
  uploadSurveyLibrary.fields([
    { name: 'video', maxCount: 1 },
    { name: 'vtt', maxCount: 1 }
  ]),
  surveyLibraryController.createAsset
);

// Update existing asset (replace video and/or vtt)
router.put(
  '/:project/asset/:assetId',
  requirePermission('Survey Library', 'edit'),
  uploadSurveyLibrary.fields([
    { name: 'video', maxCount: 1 },
    { name: 'vtt', maxCount: 1 }
  ]),
  surveyLibraryController.updateAsset
);

// Delete entire asset
router.delete('/:project/asset/:assetId', requirePermission('Survey Library', 'delete'), surveyLibraryController.deleteAsset);

module.exports = router;
