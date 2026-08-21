'use strict';

const projectFacilitiesService = require('../services/projectFacilities.service');

exports.parseExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Excel file is required' });
    }

    // Pass the projectId if needed by the service
    const projectId = req.body.projectId;

    const result = await projectFacilitiesService.parseFacilityExcel(req.file.buffer, projectId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.generateBatch = async (req, res, next) => {
  try {
    const { projectId, facilities, batchName } = req.body;
    
    if (!projectId || !facilities || !Array.isArray(facilities) || facilities.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload. projectId and facilities array are required.' });
    }

    const result = await projectFacilitiesService.generateBatch(req.user._id, projectId, facilities, batchName);

    return res.status(201).json({
      success: true,
      message: 'Project Facilities Batch generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in generateBatch:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate project facilities batch',
      error: error.message
    });
  }
};
