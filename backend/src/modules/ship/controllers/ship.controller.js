'use strict';

const overviewService = require('../services/overview.analytics.service');
const projectService = require('../services/project.analytics.service');
const cache = require('../ship.cache');
const { successResponse } = require('../../../utils/response.util');
const asyncHandler = require('../../../utils/asyncHandler.util');

const getOverview = asyncHandler(async (req, res) => {
  const cacheKey = 'ship:overview';
  let data = cache.get(cacheKey);
  
  if (!data) {
    data = await overviewService.getOverview();
    cache.set(cacheKey, data, 300); // Cache for 5 mins
  }
  
  return successResponse(res, data, 'SHIP Overview Analytics retrieved successfully');
});

const getProjects = asyncHandler(async (req, res) => {
  const cacheKey = 'ship:projects';
  let data = cache.get(cacheKey);
  
  if (!data) {
    data = await projectService.getProjectIntelligence();
    cache.set(cacheKey, data, 300);
  }
  
  return successResponse(res, data, 'SHIP Project Intelligence retrieved successfully');
});

const getAssets = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'Asset intelligence coming soon');
});

const getCategories = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'Category intelligence coming soon');
});

const getRatings = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'Rating intelligence coming soon');
});

const getInspection = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'Inspection intelligence coming soon');
});

const getUsers = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'User intelligence coming soon');
});

const getRisk = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'Risk intelligence coming soon');
});

const getTrends = asyncHandler(async (req, res) => {
  return successResponse(res, [], 'Trend intelligence coming soon');
});

module.exports = {
  getOverview,
  getProjects,
  getAssets,
  getCategories,
  getRatings,
  getInspection,
  getUsers,
  getRisk,
  getTrends
};
