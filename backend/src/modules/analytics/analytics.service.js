'use strict';

const Inspection = require('../../models/Inspection.model');
const mongoose = require('mongoose');

const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

/**
 * Gets rating trends over time (monthly/weekly)
 */
const getRatingTrends = async (projectId, period = 'monthly') => {
  const filter = {};
  if (projectId) {
    const pId = toObjectId(projectId);
    filter.$or = pId ? [{ projectId: pId }, { projectId: projectId }] : [{ projectId: projectId }];
  }

  const groupFormat = period === 'weekly' ? '%Y-W%V' : '%Y-%m';

  return Inspection.aggregate([
    { $match: filter },
    { $unwind: { path: '$parameters', preserveNullAndEmptyArrays: false } },
    { $match: { 'parameters.hoRating.value': { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$updatedAt' } },
        avgRating: { $avg: '$parameters.hoRating.value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { period: '$_id', avgRating: { $round: ['$avgRating', 2] }, count: 1, _id: 0 } }
  ]);
};

/**
 * Gets asset analysis — performance by asset type
 */
const getAssetAnalysis = async (projectId) => {
  const filter = {};
  if (projectId) {
    const pId = toObjectId(projectId);
    filter.$or = pId ? [{ projectId: pId }, { projectId: projectId }] : [{ projectId: projectId }];
  }

  return Inspection.aggregate([
    { $match: filter },
    { $unwind: { path: '$parameters', preserveNullAndEmptyArrays: false } },
    { $match: { 'parameters.hoRating.value': { $ne: null } } },
    {
      $group: {
        _id: { category: '$category', assetType: '$assetType' },
        avgRating: { $avg: '$parameters.hoRating.value' },
        count: { $sum: 1 },
        critical: { $sum: { $cond: [{ $lte: ['$parameters.hoRating.value', 1] }, 1, 0] } }
      }
    },
    { $sort: { avgRating: 1 } },
    {
      $project: {
        category: '$_id.category',
        assetType: '$_id.assetType',
        avgRating: { $round: ['$avgRating', 2] },
        count: 1,
        critical: 1,
        _id: 0
      }
    }
  ]);
};

/**
 * Gets KPI summary for a project
 */
const getKPISummary = async (projectId) => {
  const filter = {};
  if (projectId) filter.projectId = toObjectId(projectId);

  const [totalInspections, rated, pending, avgRating, byCategory] = await Promise.all([
    Inspection.countDocuments(filter),
    Inspection.countDocuments({ ...filter, hoStatus: 'RATED' }),
    Inspection.countDocuments({ ...filter, hoStatus: 'PENDING' }),
    Inspection.aggregate([
      { $match: filter },
      { $unwind: '$parameters' },
      { $match: { 'parameters.hoRating.value': { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$parameters.hoRating.value' } } }
    ]),
    Inspection.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 }, rated: { $sum: { $cond: [{ $eq: ['$hoStatus', 'RATED'] }, 1, 0] } } } }
    ])
  ]);

  const progress = totalInspections > 0 ? Math.round((rated / totalInspections) * 100) : 0;

  return {
    totalInspections,
    rated,
    pending,
    progress,
    avgRating: parseFloat((avgRating[0]?.avg || 0).toFixed(2)),
    byCategory
  };
};

/**
 * Exports summary report as structured JSON
 */
const exportSummaryReport = async (projectId) => {
  const kpi = await getKPISummary(projectId);
  const assetAnalysis = await getAssetAnalysis(projectId);
  const trends = await getRatingTrends(projectId, 'monthly');

  return {
    generatedAt: new Date().toISOString(),
    projectId,
    kpi,
    assetAnalysis,
    trends
  };
};

/**
 * Gets comparison data between two inspection cycles
 */
const getComparisonData = async (project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) => {
  // Return dummy data structure expected by the PDF generator
  return {
    metrics: {
      totalCompared: 0,
      improved: 0,
      deteriorated: 0,
      criticalIssues: 0,
      avgPreviousRating: '0.00',
      avgCurrentRating: '0.00',
      netChange: 0
    },
    assetPerformances: [],
    categoryPerformances: [],
    topDeteriorated: [],
    topImproved: [],
    criticalActionItems: [],
    criticalIssues: []
  };
};

module.exports = { getRatingTrends, getAssetAnalysis, getKPISummary, exportSummaryReport, getComparisonData };
