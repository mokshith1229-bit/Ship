'use strict';

/**
 * HiRATE 3.0 Rating Service
 * Hotfix: Safe ObjectId casting and string project code resolution for Vercel production
 */

const Inspection = require('../../models/Inspection.model');
require('../../models/MasterList.model');
require('../../models/User.model');
const mongoose = require('mongoose');

const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

const resolveProjectId = async (projectId) => {
  if (!projectId) return null;
  if (projectId instanceof mongoose.Types.ObjectId) return projectId;
  if (typeof projectId === 'string' && /^[0-9a-fA-F]{24}$/.test(projectId)) {
    return new mongoose.Types.ObjectId(projectId);
  }
  const Project = require('../../models/Project.model');
  const project = await Project.findOne({ code: projectId }).select('_id').lean();
  if (project) return project._id;
  return null;
};

/**
 * Gets all ratings for a project with version filter
 */
const getProjectRatings = async (projectId, query = {}) => {
  const pId = await resolveProjectId(projectId);
  if (!pId) return [];
  const filter = { projectId: pId };
  if (query.hoStatus) filter.hoStatus = query.hoStatus;
  if (query.category) filter.category = query.category;

  const inspections = await Inspection.find(filter)
    .select('chainage category assetType direction roadType parameters hoStatus spvStatus date reporterName')
    .sort({ chainage: 1 })
    .lean();

  return inspections;
};

/**
 * Computes overall rating for an inspection (weighted average)
 */
const computeOverallRating = async (inspectionId) => {
  const inspection = await Inspection.findById(inspectionId).lean();
  if (!inspection) throw Object.assign(new Error('Inspection not found'), { statusCode: 404 });

  const hoRatings = inspection.parameters
    .map((p) => p.hoRating?.value)
    .filter((v) => v !== null && v !== undefined);

  const spvRatings = inspection.parameters
    .map((p) => p.spvRating?.value)
    .filter((v) => v !== null && v !== undefined);

  const hoAvg = hoRatings.length
    ? parseFloat((hoRatings.reduce((a, b) => a + b, 0) / hoRatings.length).toFixed(2))
    : null;

  const spvAvg = spvRatings.length
    ? parseFloat((spvRatings.reduce((a, b) => a + b, 0) / spvRatings.length).toFixed(2))
    : null;

  return { inspectionId, hoAvg, spvAvg, hoRatedCount: hoRatings.length, spvRatedCount: spvRatings.length };
};

/**
 * Gets rating summary grouped by category for a project
 */
const getRatingSummary = async (projectId) => {
  const pId = await resolveProjectId(projectId);
  if (!pId) return [];
  return Inspection.aggregate([
    { $match: { projectId: pId } },
    { $unwind: { path: '$parameters', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$category',
        avgHORating: { $avg: '$parameters.hoRating.value' },
        avgSPVRating: { $avg: '$parameters.spvRating.value' },
        totalParameters: { $sum: 1 },
        critical: { $sum: { $cond: [{ $lte: ['$parameters.hoRating.value', 1] }, 1, 0] } }
      }
    },
    {
      $project: {
        category: '$_id',
        avgHORating: { $round: ['$avgHORating', 2] },
        avgSPVRating: { $round: ['$avgSPVRating', 2] },
        totalParameters: 1,
        critical: 1,
        _id: 0
      }
    },
    { $sort: { avgHORating: 1 } }
  ]);
};

const InspectionBatch = require('../../models/InspectionBatch.model');
const InspectionTask = require('../../models/InspectionTask.model');

/**
 * Gets rating version history for a project — returns batches from InspectionBatch collection
 */
const getVersionHistory = async (projectId) => {
  const pId = toObjectId(projectId);
  const queryFilter = pId
    ? {
        $or: [
          { project: projectId },
          { project: pId }
        ]
      }
    : { project: projectId };

  require('../../models/User.model');
  const batches = await InspectionBatch.find(queryFilter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName email')
    .lean();

  return batches;
};


/**
 * Gets batches ready for rating, with the count of ratable tasks (those with images)
 */
const getReadyBatches = async (user) => {
  let batchQuery = {};
  
  if (user && user.role === 'User') {
    const WorkAssignment = require('../../models/WorkAssignment.model');
    const userAssignments = await WorkAssignment.find({
      assignedTo: user._id,
      status: { $in: ['Assigned', 'In Progress', 'Completed'] }
    });
    
    if (userAssignments.length === 0) {
      return [];
    }
    
    const assignedBatchIds = userAssignments.map(a => a.batchId);
    batchQuery._id = { $in: assignedBatchIds };
  }

  const batches = await InspectionBatch.find(batchQuery)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName email')
    .lean();

  // For each batch, compute how many tasks have images, in-progress count, and completed count
  const batchesWithCounts = await Promise.all(batches.map(async (batch) => {
    const [ratableTaskCount, inProgressCount, completedCount] = await Promise.all([
      InspectionTask.countDocuments({
        batchId: batch._id,
        status: { $nin: ['EXTRACTION_FAILED', 'PENDING_IMAGE'] },
        'image.cloudinaryUrl': { $exists: true, $ne: null, $ne: '' }
      }),
      InspectionTask.countDocuments({
        batchId: batch._id,
        status: 'IN_PROGRESS',
        'image.cloudinaryUrl': { $exists: true, $ne: null, $ne: '' }
      }),
      InspectionTask.countDocuments({
        batchId: batch._id,
        status: 'COMPLETED',
        'image.cloudinaryUrl': { $exists: true, $ne: null, $ne: '' }
      })
    ]);

    let effectiveStatus = batch.status;
    if (inProgressCount > 0 || (completedCount > 0 && completedCount < ratableTaskCount)) {
      effectiveStatus = 'IN_PROGRESS';
    } else if (ratableTaskCount > 0 && completedCount === 0) {
      effectiveStatus = 'READY_FOR_RATING';
    } else if (ratableTaskCount > 0 && completedCount >= ratableTaskCount) {
      effectiveStatus = 'COMPLETED';
    }

    // Pre-cache count for getBatchTasks
    const defaultCacheKey = JSON.stringify({
      batchId: batch._id,
      status: { $nin: ['EXTRACTION_FAILED', 'PENDING_IMAGE'] },
      'image.cloudinaryUrl': { $exists: true, $ne: null, $ne: '' }
    });
    batchCountCache.set(defaultCacheKey, ratableTaskCount);

    return {
      ...batch,
      status: effectiveStatus,
      ratableTaskCount,
      inProgressCount,
      completedCount
    };
  }));

  return batchesWithCounts.filter(b => b.ratableTaskCount > 0);
};

const WorkAssignment = require('../../models/WorkAssignment.model');

const batchCountCache = new Map();

const getCachedCount = async (filter) => {
  const cacheKey = JSON.stringify(filter);
  if (batchCountCache.has(cacheKey)) {
    return batchCountCache.get(cacheKey);
  }
  const count = await InspectionTask.countDocuments(filter);
  batchCountCache.set(cacheKey, count);
  setTimeout(() => batchCountCache.delete(cacheKey), 300000);
  return count;
};

/**
 * Gets tasks for a batch that are ready for rating (have actual images)
 * Also attaches previous and next images for contextual display.
 * Implements RBAC: 'User' role only sees their assigned tasks.
 */
const getBatchTasks = async (batchId, user, options = {}) => {
  const bId = mongoose.Types.ObjectId.isValid(batchId) ? new mongoose.Types.ObjectId(batchId) : batchId;

  let queryFilter = {
    batchId: bId,
    status: { $nin: ['EXTRACTION_FAILED', 'PENDING_IMAGE'] },
    'image.cloudinaryUrl': { $exists: true, $ne: null, $ne: '' }
  };

  // If user is a 'User', restrict to their assignment
  if (user && user.role === 'User') {
    const WorkAssignment = require('../../models/WorkAssignment.model');
    const assignment = await WorkAssignment.findOne({
      batchId: bId,
      assignedTo: user._id,
      status: { $in: ['Assigned', 'In Progress', 'Completed'] }
    });
    
    if (!assignment) {
      // Return empty if no active assignment
      return { tasks: [], total: 0, page: 1, totalPages: 1 };
    }

    // Update assignment status to In Progress if it was just Assigned
    if (assignment.status === 'Assigned') {
      assignment.status = 'In Progress';
      assignment.startedTime = new Date();
      await assignment.save();
    }

    if (assignment.questionIds && assignment.questionIds.length > 0) {
      queryFilter._id = { $in: assignment.questionIds };
    }
  }

  // Check if the current batch is a combined Roadway-RSF batch
  const batchDoc = await InspectionBatch.findById(bId).select('name').lean();
  const isCombinedBatch = batchDoc?.name && /Roadway.*RSF|RSF.*Roadway/i.test(batchDoc.name);

  // Support optional filters from options
  if (options.category && options.category !== 'All') {
    const isRSFCat = /Road Signage|RSF/i.test(options.category);
    const isRoadwayCat = /Roadway/i.test(options.category);

    if (isCombinedBatch && (isRSFCat || isRoadwayCat)) {
      // Combined Roadway-RSF batch contains tasks ratable under both Roadway and RSF
    } else {
      const MasterList = require('../../models/MasterList.model');
      const escapedCat = options.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const catRegex = new RegExp(`^${escapedCat}$|^${escapedCat.replace('and', '&')}$`, 'i');
      
      const matchingMasterIds = await MasterList.find({
        category: catRegex
      }).distinct('_id');

      queryFilter.$or = [
        { category: options.category },
        { category: catRegex },
        ...(matchingMasterIds.length > 0 ? [{ parameters: { $in: matchingMasterIds } }] : [])
      ];
    }
  }
  if (options.direction && options.direction !== 'Choose Direction' && options.direction !== 'All') {
    queryFilter.direction = options.direction;
  }
  if (options.roadType && options.roadType !== 'Choose Road Type' && options.roadType !== 'All') {
    queryFilter.roadType = options.roadType;
  }
  if (options.minChainage || options.maxChainage) {
    queryFilter.chainage = {};
    if (options.minChainage) queryFilter.chainage.$gte = options.minChainage;
    if (options.maxChainage) queryFilter.chainage.$lte = options.maxChainage;
  }

  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.max(0, parseInt(options.limit) || 0);

  let taskQuery = InspectionTask.find(queryFilter)
    .select('_id batchId project category direction assetType assetSubType roadType parameters ratings chainage status image metadata approvedAt approvedBy createdAt updatedAt skippedAssetTypes skipMetadata imageRequirement')
    .sort({ chainage: 1 });

  if (limit > 0) {
    taskQuery = taskQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('parameters', 'category direction roadType assetType assetSubType parameter questionId');
  } else {
    taskQuery = taskQuery.populate('parameters', 'category direction roadType assetType assetSubType parameter questionId');
  }

  const [total, tasks] = await Promise.all([
    limit > 0 ? getCachedCount(queryFilter) : Promise.resolve(0),
    taskQuery.lean()
  ]);

  const finalTotal = limit > 0 ? total : tasks.length;
  const totalPages = limit > 0 ? Math.ceil(finalTotal / limit) || 1 : 1;

  if (!tasks.length) {
    return { tasks: [], total: finalTotal, page, totalPages };
  }

  const { ROADWAY_PARAMETER_CONFIG } = require('../../constants/roadwayConfig');

  // Attach previous and next images directly from sorted tasks array and format ratings for Roadway
  const tasksWithContext = tasks.map((task, idx) => {
    const prev = tasks[idx - 1];
    const next = tasks[idx + 1];

    let effectiveCategory = task.category || (task.parameters && task.parameters[0]?.category) || '-';
    let effectiveAssetType = task.assetType || (task.parameters && task.parameters[0]?.assetType) || '-';

    if (isCombinedBatch && options.category && options.category !== 'All') {
      effectiveCategory = options.category;
      if (/Road Signage|RSF/i.test(options.category)) {
        effectiveAssetType = task.assetType === 'Multi-Asset' ? 'Road Signage & Furniture' : (task.assetType || 'Road Signage & Furniture');
      }
    }

    let formattedRatings = task.ratings || [];
    if (effectiveCategory === 'Roadway' || (isCombinedBatch && !options.category)) {
      formattedRatings = ROADWAY_PARAMETER_CONFIG.map((cfg, i) => {
        const existing = (task.ratings && task.ratings[i]) || {};
        return {
          ...cfg,
          score: existing.score !== undefined ? existing.score : 10,
          remark: existing.remark || '',
          masterListId: existing.masterListId || existing._id || null,
          _id: existing._id || null
        };
      });
    }

    return {
      ...task,
      category: effectiveCategory,
      assetType: effectiveAssetType,
      ratings: formattedRatings,
      previousImage: prev && prev.image?.cloudinaryUrl ? { url: prev.image.cloudinaryUrl, chainage: prev.chainage } : null,
      nextImage: next && next.image?.cloudinaryUrl ? { url: next.image.cloudinaryUrl, chainage: next.chainage } : null
    };
  });
  
  return {
    tasks: tasksWithContext,
    total: finalTotal,
    page,
    totalPages
  };
};

/**
 * Saves ratings for a task (chainage)
 */
const saveTaskRatings = async (taskId, ratingsData, selectedImageUrl, user) => {
  const task = await InspectionTask.findById(taskId);
  if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });

  // RBAC: If user is 'User', verify they are assigned this task
  if (user && user.role === 'User') {
    const assignment = await WorkAssignment.findOne({
      batchId: task.batchId,
      assignedTo: user._id,
      status: { $in: ['Assigned', 'In Progress'] }
    });

    if (!assignment) {
      throw Object.assign(new Error('Forbidden: No active assignment for this batch'), { statusCode: 403 });
    }

    if (assignment.questionIds && assignment.questionIds.length > 0) {
      const isAssigned = assignment.questionIds.some(qId => qId.toString() === taskId.toString());
      if (!isAssigned) {
        throw Object.assign(new Error('Forbidden: You are not assigned to rate this specific task'), { statusCode: 403 });
      }
    }
  }

  task.ratings = ratingsData;
  if (selectedImageUrl) {
    if (!task.image) task.image = {};
    task.image.cloudinaryUrl = selectedImageUrl;
  }
  task.status = 'COMPLETED'; // Or 'RATED' based on the workflow
  await task.save();

  // Check if batch is completed
  const remainingTasks = await InspectionTask.countDocuments({ 
    batchId: task.batchId, 
    status: { $ne: 'COMPLETED' } 
  });

  if (remainingTasks === 0) {
    const batch = await InspectionBatch.findById(task.batchId);
    if (batch) {
      batch.status = 'COMPLETED';
      await batch.save();
    }
    
    // Also mark assignment as completed if user is a 'User'
    if (user && user.role === 'User') {
       await WorkAssignment.updateMany(
         { batchId: task.batchId, status: { $in: ['Assigned', 'In Progress'] } },
         { $set: { status: 'Completed', completedTime: new Date() } }
       );
    }
  } else {
    // If it was READY_FOR_RATING, move to IN_PROGRESS
    const batch = await InspectionBatch.findById(task.batchId);
    if (batch && batch.status === 'READY_FOR_RATING') {
      batch.status = 'IN_PROGRESS';
      await batch.save();
    }
  }

  return task;
};

/**
 * Export completed ratings to CSV
 */
const exportRatingsCSV = async (projectId) => {
  const tasks = await InspectionTask.find({ 
    project: projectId, 
    status: 'COMPLETED' 
  })
    .populate('parameters')
    .sort({ chainage: 1 });

  const headers = ['ASSET ID', 'PROJECT', 'CATEGORY', 'ASSET TYPE', 'CHAINAGE', 'DIRECTION', 'PARAMETER', 'SCORE', 'REMARK', 'IMAGE URL', 'RATED AT'];
  const rows = [];
  rows.push(headers.join(','));

  tasks.forEach(task => {
    const assetId = (task._id || '').toString().slice(-6).toUpperCase();
    const aType = task.assetSubType ? `${task.assetType} (${task.assetSubType})` : (task.assetType || '-');
    const project = task.project || '-';
    const chainage = task.chainage || '-';
    const imageUrl = task.image?.cloudinaryUrl || '-';
    const ratedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('en-GB') : '-';

    if (task.ratings && task.ratings.length > 0) {
      task.ratings.forEach(rating => {
        // Find matching parameter
        const param = task.parameters.find(p => p._id.toString() === rating.masterListId.toString());
        const category = param ? param.category : '-';
        const paramText = param ? param.parameter : '-';
        const direction = param && param.direction ? param.direction : '-';
        
        const row = [
          `"${assetId}"`,
          `"${project}"`,
          `"${category}"`,
          `"${aType}"`,
          `"${chainage}"`,
          `"${direction}"`,
          `"${paramText.replace(/"/g, '""')}"`,
          `"${rating.score}"`,
          `"${(rating.remark || '').replace(/"/g, '""')}"`,
          `"${imageUrl}"`,
          `"${ratedAt}"`
        ];
        rows.push(row.join(','));
      });
    }
  });

  return rows.join('\n');
};

/**
 * Skips a task (chainage) with a reason
 */
const skipTask = async (taskId, skipData, user) => {
  const task = await InspectionTask.findById(taskId);
  if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });

  // RBAC: If user is 'User', verify they are assigned this task
  if (user && user.role === 'User') {
    const assignment = await WorkAssignment.findOne({
      batchId: task.batchId,
      assignedTo: user._id,
      status: { $in: ['Assigned', 'In Progress'] }
    });

    if (!assignment) {
      throw Object.assign(new Error('Forbidden: No active assignment for this batch'), { statusCode: 403 });
    }

    if (assignment.questionIds && assignment.questionIds.length > 0) {
      const isAssigned = assignment.questionIds.some(qId => qId.toString() === taskId.toString());
      if (!isAssigned) {
        throw Object.assign(new Error('Forbidden: You are not assigned to rate this specific task'), { statusCode: 403 });
      }
    }
  }

  if (!skipData.reason) {
    throw Object.assign(new Error('Skip reason is required'), { statusCode: 400 });
  }

  if (skipData.reason === 'Other' && !skipData.remarks) {
    throw Object.assign(new Error('Remarks are required when skip reason is "Other"'), { statusCode: 400 });
  }

  task.status = 'SKIPPED';
  task.skipMetadata = {
    reason: skipData.reason,
    remarks: skipData.remarks || '',
    skippedBy: user._id,
    skippedAt: new Date()
  };
  await task.save();

  // Check if batch is completed
  const remainingTasks = await InspectionTask.countDocuments({ 
    batchId: task.batchId, 
    status: { $nin: ['COMPLETED', 'SKIPPED'] } 
  });

  if (remainingTasks === 0) {
    const batch = await InspectionBatch.findById(task.batchId);
    if (batch) {
      batch.status = 'COMPLETED';
      await batch.save();
    }
    
    // Also mark assignment as completed if user is a 'User'
    if (user && user.role === 'User') {
       await WorkAssignment.updateMany(
         { batchId: task.batchId, status: { $in: ['Assigned', 'In Progress'] } },
         { $set: { status: 'Completed', completedTime: new Date() } }
       );
    }
  } else {
    // If it was READY_FOR_RATING, move to IN_PROGRESS
    const batch = await InspectionBatch.findById(task.batchId);
    if (batch && batch.status === 'READY_FOR_RATING') {
      batch.status = 'IN_PROGRESS';
      await batch.save();
    }
  }

  return task;
};

module.exports = { getProjectRatings, computeOverallRating, getRatingSummary, getVersionHistory, getReadyBatches, getBatchTasks, saveTaskRatings, skipTask, exportRatingsCSV };
