'use strict';

const structureEngineService = require('../services/structureEngine.service');

exports.detectSheets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const result = await structureEngineService.detectSheets(req.file.buffer);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in detectSheets:', error);
    return res.status(500).json({ success: false, message: 'Failed to detect sheets', error: error.message });
  }
};

exports.parseExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Excel file is required' });
    }

    const interval = req.body.interval ? parseInt(req.body.interval, 10) : 20;
    let selectedSheets = [];
    if (req.body.selectedSheets) {
      try {
        selectedSheets = JSON.parse(req.body.selectedSheets);
      } catch (e) {
        selectedSheets = [];
      }
    }
    
    const minChainage = req.body.minChainage ? parseFloat(req.body.minChainage) : null;
    const maxChainage = req.body.maxChainage ? parseFloat(req.body.maxChainage) : null;
    const structureTypeFilter = req.body.structureTypeFilter || 'All Structures';

    const result = await structureEngineService.parseStructureExcel(req.file.buffer, interval, selectedSheets, minChainage, maxChainage, structureTypeFilter);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.generateBatch = async (req, res) => {
  try {
    const { projectId, structures, batchName } = req.body;
    
    if (!projectId || !structures || !Array.isArray(structures) || structures.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload. projectId and structures array are required.' });
    }

    const result = await structureEngineService.generateBatch(req.user._id, projectId, structures, batchName);

    return res.status(201).json({
      success: true,
      message: 'Structure Batch generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in generateBatch:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate structure batch',
      error: error.message
    });
  }
};
