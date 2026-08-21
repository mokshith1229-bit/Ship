'use strict';

const atmsService = require('../services/atms.service');

const parseExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Excel file is required' });
    }

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const result = await atmsService.parseAtmsExcel(req.file.buffer, projectId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error parsing ATMS Excel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateBatch = async (req, res) => {
  try {
    const { projectId, assets, batchName } = req.body;

    if (!projectId || !assets || !assets.length) {
      return res.status(400).json({ success: false, message: 'Project ID and valid assets are required' });
    }

    const result = await atmsService.generateBatch(req.user._id, projectId, assets, batchName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating ATMS batch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  parseExcel,
  generateBatch
};
