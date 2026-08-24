const asyncHandler = require('../../utils/asyncHandler.util');
const { successResponse } = require('../../utils/response.util');
const cycleExtensionService = require('./cycleExtension.service');

const previewAddToCycle = asyncHandler(async (req, res) => {
  const { newMasterListIds, batchId, project } = req.body;
  if (!newMasterListIds || !Array.isArray(newMasterListIds) || newMasterListIds.length === 0) {
    throw new Error('newMasterListIds array is required');
  }
  if (!batchId) {
    throw new Error('batchId is required');
  }
  if (!project) {
    throw new Error('project is required');
  }

  const result = await cycleExtensionService.previewAddToCycle(newMasterListIds, batchId, project);
  return successResponse(res, result, 'Preview generated successfully');
});

const executeAddToCycle = asyncHandler(async (req, res) => {
  const { newMasterListIds, batchId, project } = req.body;
  if (!newMasterListIds || !Array.isArray(newMasterListIds) || newMasterListIds.length === 0) {
    throw new Error('newMasterListIds array is required');
  }
  if (!batchId) {
    throw new Error('batchId is required');
  }
  if (!project) {
    throw new Error('project is required');
  }

  const result = await cycleExtensionService.executeAddToCycle(newMasterListIds, batchId, project, req.user);
  return successResponse(res, result, 'Parameters added to cycle successfully');
});

module.exports = {
  previewAddToCycle,
  executeAddToCycle
};
