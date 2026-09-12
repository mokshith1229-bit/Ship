'use strict';

const reportService = require('./report.service');
const { successResponse } = require('../../utils/response.util');
const asyncHandler = require('../../utils/asyncHandler.util');

const getConfig = asyncHandler(async (req, res) => {
  const config = await reportService.getConfig();
  return successResponse(res, config, 'Report config retrieved successfully');
});

const getAssetTypes = asyncHandler(async (req, res) => {
  const { project, cycleId, roadType, direction } = req.query;
  const assets = await reportService.getAssetTypes(project, cycleId, roadType, direction);
  return successResponse(res, assets, 'Asset types retrieved successfully');
});

const getSummary = asyncHandler(async (req, res) => {
  const { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction } = req.query;
  const summary = await reportService.getSummary(project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction);
  return successResponse(res, summary, 'Report summary retrieved successfully');
});

const getStripChartData = asyncHandler(async (req, res) => {
  const { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction } = req.query;
  const stripChartData = await reportService.getStripChartData(project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction);
  return successResponse(res, stripChartData, 'Strip chart data retrieved successfully');
});

const generateReport = asyncHandler(async (req, res) => {
  const { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction } = req.query;
  const buffer = await reportService.generateExcelReport(project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Comprehensive_Audit_Report_${project}_${new Date().toISOString().slice(0, 10)}.xlsx"`);
  
  res.send(buffer);
});

const generatePdfReport = asyncHandler(async (req, res, next) => {
  try {
    const { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction, isSummary } = req.query;
    
    res.setHeader('Content-Type', 'application/pdf');
    const prefix = isSummary === 'true' ? 'Summary_Report' : 'Comprehensive_Audit_Report';
    res.setHeader('Content-Disposition', `attachment; filename="${prefix}_${project}_${new Date().toISOString().slice(0, 10)}.pdf"`);
    
    // The service will stream directly to the response object
    const isSummaryBool = isSummary === 'true';
    await reportService.generatePdfReport(project, cycleId, res, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction, isSummaryBool);
  } catch (error) {
    console.error("DEBUG - generatePdfReport Error:", error);
    next(error);
  }
});

const generateComparisonPdfReport = asyncHandler(async (req, res) => {
  const { project, versionA, versionB, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction } = req.query;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Issue_Comparison_Report_${project}_${new Date().toISOString().slice(0, 10)}.pdf"`);
  
  await reportService.generateComparisonPdfReport(project, versionA, versionB, res, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction);
});

const getOverviewStripChartData = asyncHandler(async (req, res) => {
  const { project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction } = req.query;
  const data = await reportService.getOverviewStripChartData(project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction);
  return successResponse(res, data, 'Overview strip chart data retrieved successfully');
});

module.exports = {
  getConfig,
  getAssetTypes,
  getSummary,
  getStripChartData,
  generateReport,
  generatePdfReport,
  generateComparisonPdfReport,
  getOverviewStripChartData
};
