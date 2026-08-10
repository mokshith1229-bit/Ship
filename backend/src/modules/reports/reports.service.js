'use strict';

const mongoose = require('mongoose');
const User = require('../../models/User.model');
const Project = require('../../models/Project.model');
const Inspection = require('../../models/Inspection.model');

const toObjectId = (id) => mongoose.Types.ObjectId.createFromHexString(id);

/**
 * Gets a leaderboard/list of all SPVs with basic aggregate stats
 */
const getSPVLeaderboard = async () => {
  // Find all projects and group by code
  const projects = await Project.find().select('_id code fullName status');
  
  const spvMap = {};
  for (const p of projects) {
    if (!p.code) continue;
    if (!spvMap[p.code]) {
      spvMap[p.code] = {
        _id: p.code,
        name: p.code,
        fullName: p.fullName,
        manager: p.reportedBy || 'Swaraj',
        designation: 'Senior Project Manager',
        projectIds: [],
        totalProjects: 0,
        completedProjects: 0,
        avgRating: 0
      };
    }
    
    spvMap[p.code].projectIds.push(p._id);
    spvMap[p.code].totalProjects++;
    if (p.status === 'SPV-RATED' || p.status === 'HO-RATED') {
      spvMap[p.code].completedProjects++;
    }
  }

  const leaderboard = Object.values(spvMap);

  const InspectionTask = require('../../models/InspectionTask.model');

  for (const spv of leaderboard) {
    const ratingAggr = await InspectionTask.aggregate([
      { $match: { project: spv._id } },
      { $unwind: '$ratings' },
      { $match: { 'ratings.score': { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$ratings.score' } } }
    ]);
    if (ratingAggr.length > 0) {
      spv.avgRating = parseFloat((ratingAggr[0].avg).toFixed(2));
    }
    delete spv.projectIds;
  }

  // Sort by average rating descending
  leaderboard.sort((a, b) => b.avgRating - a.avgRating);
  
  return leaderboard;
};

/**
 * Gets comprehensive analytics for a specific SPV
 */
const getSPVAnalytics = async (spvId) => {
  const spvCode = spvId;
  const projects = await Project.find({ code: spvCode });
  
  if (!projects || projects.length === 0) throw new Error('SPV not found');

  const projectIds = projects.map(p => p._id);
  
  let totalProjects = projects.length;
  let approvedProjects = 0;
  let completedProjects = 0;
  let rejectedProjects = 0;
  let inProgressProjects = 0;

  projects.forEach(p => {
    if (p.status === 'HO-RATED') approvedProjects++;
    else if (p.status === 'SPV-RATED') completedProjects++;
    else if (p.status === 'ON-GOING' || p.status === 'HO-PROCESS') inProgressProjects++;
    else rejectedProjects++; 
  });

  // Project Table Data
  const projectTable = projects.map(p => ({
    _id: p._id,
    name: p.fullName || p.code,
    roadName: p.highway || p.client || 'N/A',
    assignedDate: p.dateCreated || p.createdAt,
    status: p.status,
    progress: (p.status === 'SPV-RATED' || p.status === 'HO-RATED') ? 100 : (p.status === 'HO-PROCESS' ? 60 : 30)
  }));

  // 2. Inspection Ratings Analysis
  let avgRating = 0;
  let totalRatings = 0;
  let ratings1 = 0;
  let ratings5 = 0;
  let ratings10 = 0;
  let imagesRated = 0;
  let categoryPerformance = [];

  const InspectionTask = require('../../models/InspectionTask.model');

  // Total Inspections
  imagesRated = await InspectionTask.countDocuments({ project: spvCode });

  if (imagesRated > 0) {
    const ratingAggr = await InspectionTask.aggregate([
      { $match: { project: spvCode } },
      { $unwind: '$ratings' },
      { $match: { 'ratings.score': { $ne: null } } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$ratings.score' },
          total: { $sum: 1 },
          count1: { $sum: { $cond: [{ $eq: ['$ratings.score', 1] }, 1, 0] } },
          count5: { $sum: { $cond: [{ $eq: ['$ratings.score', 5] }, 1, 0] } },
          count10: { $sum: { $cond: [{ $eq: ['$ratings.score', 10] }, 1, 0] } }
        }
      }
    ]);

    if (ratingAggr.length > 0) {
      avgRating = parseFloat((ratingAggr[0].avg).toFixed(2));
      totalRatings = ratingAggr[0].total;
      ratings1 = ratingAggr[0].count1;
      ratings5 = ratingAggr[0].count5;
      ratings10 = ratingAggr[0].count10;
    }

    // Category Performance
    const catAggr = await InspectionTask.aggregate([
      { $match: { project: spvCode } },
      { $unwind: '$ratings' },
      { $match: { 'ratings.score': { $ne: null } } },
      {
        $group: {
          _id: '$assetType',
          avg: { $avg: '$ratings.score' },
          total: { $sum: 1 }
        }
      },
      { $sort: { avg: -1 } }
    ]);
    
    categoryPerformance = catAggr.map(c => ({
      category: c._id || 'Uncategorized',
      avgRating: parseFloat((c.avg).toFixed(2)),
      totalRatings: c.total,
      completion: Math.min(100, Math.round(c.total / 10)) // mock completion calculation if not strictly stored
    }));
  }

  const completionPercent = totalProjects > 0 ? Math.round(((completedProjects + approvedProjects) / totalProjects) * 100) : 0;

  let contributors = [];
  if (imagesRated > 0) {
    const contributorsAggr = await InspectionTask.aggregate([
      { $match: { project: spvCode } },
      { $match: { approvedBy: { $ne: null } } },
      {
        $group: {
          _id: '$approvedBy',
          inspections: { $addToSet: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userName: '$user.name',
          imagesCount: { $size: '$inspections' }
        }
      },
      { $sort: { imagesCount: -1 } }
    ]);
    contributors = contributorsAggr;
  }

  return {
    spv: {
      name: spvCode,
      fullName: projects[0].fullName,
      manager: projects[0].reportedBy || 'Swaraj',
      designation: 'Senior Project Manager',
      isActive: true,
      createdAt: projects[0].createdAt || new Date(),
      lastLogin: new Date()
    },
    kpi: {
      totalProjects,
      approvedProjects,
      completedProjects,
      rejectedProjects,
      avgRating,
      totalRatings,
      imagesRated,
      completionPercent
    },
    ratingAnalytics: {
      ratings1,
      ratings5,
      ratings10,
      highestRatedCategory: categoryPerformance.length > 0 ? categoryPerformance[0].category : 'N/A',
      lowestRatedCategory: categoryPerformance.length > 0 ? categoryPerformance[categoryPerformance.length - 1].category : 'N/A',
    },
    categoryPerformance,
    projects: projectTable,
    contributors
  };
};

module.exports = {
  getSPVLeaderboard,
  getSPVAnalytics
};
