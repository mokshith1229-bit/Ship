'use strict';

const Inspection = require('../../models/Inspection.model');
const InspectionBatch = require('../../models/InspectionBatch.model');
const InspectionTask = require('../../models/InspectionTask.model');
const MasterList = require('../../models/MasterList.model');
const User = require('../../models/User.model');
const WorkAssignment = require('../../models/WorkAssignment.model');
const mongoose = require('mongoose');

const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

/**
 * Gets all ratings for a project with version filter
 */
const getProjectRatings = async (projectId, query = {}) => {
  const objId = toObjectId(projectId);
  const filter = objId 
    ? { $or: [{ projectId: objId }, { project: projectId }] }
    : { project: projectId };

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
  const objId = toObjectId(projectId);
  const matchFilter = objId 
    ? { $or: [{ projectId: objId }, { project: projectId }] }
    : { project: projectId };

  return Inspection.aggregate([
    { $match: matchFilter },
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

/**
 * Gets version history — batches for a project or all rated inspections
 */
const getVersionHistory = async (projectId) => {
  const query = {
    $or: [
      { project: projectId },
      { project: { $regex: new RegExp(`^${projectId}$`, 'i') } }
    ]
  };
  const objId = toObjectId(projectId);
  if (objId) {
    query.$or.push({ projectId: objId }, { _id: objId });
  }

  const batches = await InspectionBatch.find(query)
    .select('_id name project categories assetTypes status createdAt updatedAt ratableTaskCount reviewCompleted')
    .sort({ createdAt: -1 })
    .lean();

  if (batches && batches.length > 0) {
    return batches;
  }

  if (objId) {
    return Inspection.aggregate([
      { $match: { projectId: objId, hoStatus: 'RATED' } },
      {
        $group: {
          _id: { $dateToString: { format: '%b %y', date: '$updatedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $project: { version: '$_id', count: 1, _id: 0 } }
    ]);
  }

  return [];
};

/**
 * Gets batches ready for rating, with the count of ratable tasks (those with images)
 */
const getReadyBatches = async (user) => {
  let batchQuery = { status: { $in: ['READY_FOR_RATING', 'IN_PROGRESS', 'COMPLETED'] } };

  const batches = await InspectionBatch.find(batchQuery)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName email')
    .lean();

  // For each batch, compute how many tasks actually have images ready for rating
  const batchesWithCounts = await Promise.all(batches.map(async (batch) => {
    const ratableTaskCount = await InspectionTask.countDocuments({
      batchId: batch._id,
      status: { $nin: ['EXTRACTION_FAILED', 'PENDING_IMAGE'] },
      'image.cloudinaryUrl': { $exists: true, $ne: null, $ne: '' }
    });
    return {
      ...batch,
      ratableTaskCount
    };
  }));

  return batchesWithCounts;
};

/**
 * Gets tasks for a batch that are ready for rating (have actual images)
 * Also attaches previous and next images for contextual display.
 * Implements RBAC: 'User' role only sees their assigned tasks.
 */
const getBatchTasks = async (batchId, user, options = {}) => {
  let queryFilter = {
    batchId,
    status: { $nin: ['EXTRACTION_FAILED', 'PENDING_IMAGE'] }
  };

  // If assignmentId or user assignment exists, track status and filter by assigned questionIds if present
  let assignment = null;
  if (options.assignmentId) {
    assignment = await WorkAssignment.findById(options.assignmentId);
  } else if (user && user.role === 'User') {
    assignment = await WorkAssignment.findOne({
      batchId,
      assignedTo: user._id
    });
  }

  if (assignment) {
    if (assignment.status === 'Assigned') {
      assignment.status = 'In Progress';
      assignment.startedTime = new Date();
      await assignment.save();
    }
    if (assignment.questionIds && assignment.questionIds.length > 0) {
      queryFilter._id = { $in: assignment.questionIds };
    }
  }

  // Handle category filter: only apply if valid standard category or matched
  if (options.category && options.category !== 'All') {
    const validCategories = ['Roadway', 'Structures', 'Project Facilities', 'ATMS'];
    const matchedCategory = validCategories.find(c => c.toLowerCase() === options.category.toLowerCase());
    if (matchedCategory) {
      queryFilter.category = matchedCategory;
    } else if (!assignment || !assignment.questionIds || assignment.questionIds.length === 0) {
      if (/structure/i.test(options.category)) {
        queryFilter.category = 'Structures';
      } else if (/roadway/i.test(options.category)) {
        queryFilter.category = 'Roadway';
      } else if (/facilit/i.test(options.category)) {
        queryFilter.category = 'Project Facilities';
      } else if (/atms/i.test(options.category)) {
        queryFilter.category = 'ATMS';
      }
    }
  }

  if (options.direction && options.direction !== 'Choose Direction' && options.direction !== 'All') {
    queryFilter.direction = options.direction;
  }
  if (options.roadType && options.roadType !== 'Choose Road Type' && options.roadType !== 'All') {
    if (options.roadType === 'SR') {
      queryFilter.roadType = { $in: ['SR', 'Service Road'] };
    } else if (options.roadType === 'MCW') {
      queryFilter.roadType = { $in: ['MCW', 'Main Carriageway'] };
    } else {
      queryFilter.roadType = options.roadType;
    }
  }
  if (options.minChainage || options.maxChainage) {
    queryFilter.chainage = {};
    if (options.minChainage) queryFilter.chainage.$gte = parseFloat(options.minChainage);
    if (options.maxChainage) queryFilter.chainage.$lte = parseFloat(options.maxChainage);
  }

  // Pagination support — default: all tasks (limit=0 means no limit)
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = parseInt(options.limit) || 0; // 0 = no pagination (backward compat)
  const skip = limit > 0 ? (page - 1) * limit : 0;
  let total = 0;
  if (limit > 0) {
    total = await InspectionTask.countDocuments(queryFilter);
  }
  let query = InspectionTask.find(queryFilter)
    .select('-metadata -extractionDiagnostics')
    .populate('parameters')
    .sort({ chainage: 1 });
  if (limit > 0) {
    query = query.skip(skip).limit(limit);
  }

  const tasks = await query.lean();
  if (!tasks.length) {
    return limit > 0
      ? { tasks: [], total, page, totalPages: Math.ceil(total / limit) }
      : tasks;
  }

  // ── Attach prev/next images using the already-fetched sorted tasks ──────────
  // PERF FIX: Previously this re-queried ALL project tasks (another ~29 MB download).
  // Now we compute prev/next from the sorted tasks we already have in memory.
  // Tasks are already sorted by chainage ascending from the query above.
  const tasksWithContext = tasks.map((task, idx) => {
    // Walk backwards to find the nearest previous task that has an image
    let prevTask = null;
    for (let i = idx - 1; i >= 0; i--) {
      if (tasks[i].image && tasks[i].image.cloudinaryUrl) {
        prevTask = tasks[i];
        break;
      }
    }

    // Walk forward to find the nearest next task that has an image
    let nextTask = null;
    for (let i = idx + 1; i < tasks.length; i++) {
      if (tasks[i].image && tasks[i].image.cloudinaryUrl) {
        nextTask = tasks[i];
        break;
      }
    }

    return {
      ...task,
      previousImage: prevTask ? { url: prevTask.image.cloudinaryUrl, chainage: prevTask.chainage } : null,
      nextImage: nextTask ? { url: nextTask.image.cloudinaryUrl, chainage: nextTask.chainage } : null
    };
  });
  
  // Return paginated result if pagination was requested, otherwise bare array (backward compat)
  if (limit > 0) {
    return {
      tasks: tasksWithContext,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  return tasksWithContext;
};

/**
 * Saves ratings for a task (chainage)
 */
const saveTaskRatings = async (taskId, ratingsData, selectedImageUrl, user) => {
  const task = await InspectionTask.findById(taskId);
  if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });

  // RBAC: If user is 'User', verify assignment if applicable
  if (user && user.role === 'User') {
    const assignment = await WorkAssignment.findOne({
      batchId: task.batchId,
      assignedTo: user._id
    });

    if (assignment && assignment.status === 'Assigned') {
      assignment.status = 'In Progress';
      assignment.startedTime = new Date();
      await assignment.save();
    }
  }

  task.ratings = ratingsData;
  if (selectedImageUrl) {
    if (!task.image) task.image = {};
    task.image.cloudinaryUrl = selectedImageUrl;
  }
  
  if (task.category === 'Roadway') {
    const ratedRoadwayGroups = new Set((task.ratings || []).filter(r => r.group).map(r => r.group));
    const skippedGroups = new Set((task.skippedAssetTypes || []).map(s => s.assetType));
    const requiredRoadwayGroups = ['Pavement', 'Shoulder', 'Kerb', 'Pavement Markings', 'ROW', 'Median Plantation'];
    const isRoadwayCompleted = requiredRoadwayGroups.every(g => ratedRoadwayGroups.has(g) || skippedGroups.has(g));
    
    if (isRoadwayCompleted) {
      task.status = 'COMPLETED';
    } else {
      task.status = 'IN_PROGRESS';
    }
  } else {
    task.status = 'COMPLETED';
  }
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
         { batchId: task.batchId, assignedTo: user._id, status: { $in: ['Assigned', 'In Progress', 'Overdue'] } },
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
const exportRatingsCSV = async (projectId, batchId) => {
  const query = { 
    project: projectId, 
    status: { $in: ['COMPLETED', 'SKIPPED'] }
  };
  
  if (batchId) {
    query.batchId = batchId;
  }

  const tasks = await InspectionTask.find(query)
    .populate('parameters')
    .sort({ chainage: 1 });

  const headers = ['ASSET ID', 'PROJECT', 'CATEGORY', 'ASSET TYPE', 'CHAINAGE', 'ROAD TYPE', 'DIRECTION', 'PARAMETER', 'SCORE', 'REMARK', 'IMAGE URL', 'RATED AT'];
  const rows = [];
  rows.push(headers.join(','));
  
  const skipHeaders = ['CATEGORY', 'ASSET TYPE', 'CHAINAGE', 'ROAD TYPE', 'SKIP REASON', 'REMARKS', 'IMAGE URL'];
  const skipRows = [];
  skipRows.push(skipHeaders.join(','));

  tasks.forEach(task => {
    const assetId = (task._id || '').toString().slice(-6).toUpperCase();
    const project = task.project || '-';
    const chainage = task.chainage || '-';
    const imageUrl = task.image?.cloudinaryUrl || '-';
    const ratedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('en-GB') : '-';

    // Process Ratings
    if (task.status === 'COMPLETED' && task.ratings && task.ratings.length > 0) {
      task.ratings.forEach(rating => {
        let category = '-';
        let paramText = '-';
        let direction = '-';
        let aType = task.assetSubType ? `${task.assetType} (${task.assetSubType})` : (task.assetType || '-');

        if (rating.masterListId) {
          const param = task.parameters.find(p => p._id.toString() === rating.masterListId.toString());
          category = param ? param.category : '-';
          paramText = param ? param.parameter : '-';
          direction = param && param.direction ? param.direction : '-';
          if (param && param.assetType) {
            aType = param.assetSubType ? `${param.assetType} (${param.assetSubType})` : param.assetType;
          }
        } else if (rating.parameterKey) {
          category = task.category || 'Roadway';
          // Correctly map Roadway group to Asset Type
          if (category === 'Roadway' && rating.group) {
            aType = rating.group;
          }
          paramText = rating.parameterName || rating.parameterKey;
          direction = task.direction || '-';
        }
        
        // Format Road Type nicely if possible
        let roadTypeStr = task.roadType || '-';
        if (roadTypeStr === 'Main Carriageway') roadTypeStr = 'MCW';
        if (roadTypeStr === 'Service Road') roadTypeStr = 'SR';

        const row = [
          `"${assetId}"`,
          `"${project}"`,
          `"${category}"`,
          `"${aType}"`,
          `"${chainage}"`,
          `"${roadTypeStr}"`,
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

    // Process Skips
    let roadTypeStr = task.roadType || '-';
    if (roadTypeStr === 'Main Carriageway') roadTypeStr = 'MCW';
    if (roadTypeStr === 'Service Road') roadTypeStr = 'SR';

    if (task.skippedAssetTypes && task.skippedAssetTypes.length > 0) {
      task.skippedAssetTypes.forEach(skip => {
        const skipRow = [
          `"${task.category || '-'}"`,
          `"${skip.assetType || '-'}"`,
          `"${chainage}"`,
          `"${roadTypeStr}"`,
          `"${(skip.reason || '').replace(/"/g, '""')}"`,
          `"${(skip.remarks || '').replace(/"/g, '""')}"`,
          `"${imageUrl}"`
        ];
        skipRows.push(skipRow.join(','));
      });
    } else if (task.status === 'SKIPPED' && task.skipMetadata) {
      // Legacy / full task skip
      const skipRow = [
        `"${task.category || '-'}"`,
        `"${task.assetType || '-'}"`,
        `"${chainage}"`,
        `"${roadTypeStr}"`,
        `"${(task.skipMetadata.reason || '').replace(/"/g, '""')}"`,
        `"${(task.skipMetadata.remarks || '').replace(/"/g, '""')}"`,
        `"${imageUrl}"`
      ];
      skipRows.push(skipRow.join(','));
    }
  });

  return rows.join('\n') + '\n\n' + '=== SKIP GALLERY / SKIPPED ASSETS ===\n\n' + skipRows.join('\n');
};

/**
 * Skips a task (chainage) with a reason
 */
const skipTask = async (taskId, skipData, user) => {
  const task = await InspectionTask.findById(taskId);
  if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });

  // RBAC: If user is 'User', verify assignment if applicable
  if (user && user.role === 'User') {
    const assignment = await WorkAssignment.findOne({
      batchId: task.batchId,
      assignedTo: user._id
    });

    if (assignment && assignment.status === 'Assigned') {
      assignment.status = 'In Progress';
      assignment.startedTime = new Date();
      await assignment.save();
    }
  }

  const reason = skipData.skipReason || skipData.reason;
  if (!reason) {
    throw Object.assign(new Error('Skip reason is required'), { statusCode: 400 });
  }

  if (reason === 'Other' && !skipData.remarks) {
    throw Object.assign(new Error('Remarks are required when skip reason is "Other"'), { statusCode: 400 });
  }

  if (skipData.assetType) {
    // Asset-level skip
    if (!task.skippedAssetTypes) task.skippedAssetTypes = [];
    
    // Remove if already exists to update
    task.skippedAssetTypes = task.skippedAssetTypes.filter(s => s.assetType !== skipData.assetType);
    
    task.skippedAssetTypes.push({
      assetType: skipData.assetType,
      reason: reason,
      remarks: skipData.remarks || '',
      skippedBy: user._id,
      skippedAt: new Date()
    });

    if (task.category === 'Roadway') {
      const ratedRoadwayGroups = new Set((task.ratings || []).filter(r => r.group).map(r => r.group));
      const skippedGroups = new Set(task.skippedAssetTypes.map(s => s.assetType));
      const requiredRoadwayGroups = ['Pavement', 'Shoulder', 'Kerb', 'Pavement Markings', 'ROW', 'Median Plantation'];
      const isRoadwayCompleted = requiredRoadwayGroups.every(g => ratedRoadwayGroups.has(g) || skippedGroups.has(g));
      
      if (isRoadwayCompleted) {
        task.status = 'COMPLETED';
      } else {
        task.status = 'IN_PROGRESS';
      }
    } else {
      const totalAssetTypes = new Set((task.parameters || []).map(p => p.assetType)).size;
      if (task.skippedAssetTypes.length >= totalAssetTypes) {
        task.status = 'SKIPPED';
      } else {
        task.status = 'IN_PROGRESS';
      }
    }
  } else {
    // Legacy / Full task skip
    task.status = 'SKIPPED';
    task.skipMetadata = {
      reason: reason,
      remarks: skipData.remarks || '',
      skippedBy: user._id,
      skippedAt: new Date()
    };
  }
  
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
         { batchId: task.batchId, assignedTo: user._id, status: { $in: ['Assigned', 'In Progress', 'Overdue'] } },
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

const unskipTask = async (taskId, payload, user) => {
  const task = await InspectionTask.findById(taskId);
  if (!task) {
    throw Object.assign(new Error('Task not found'), { statusCode: 404 });
  }

  if (user && user.role === 'User') {
    const assignment = await WorkAssignment.findOne({
      assignedTo: user._id,
      batchId: task.batchId
    });
  }

  if (payload.assetType) {
    // Asset-level unskip
    if (task.skippedAssetTypes) {
      task.skippedAssetTypes = task.skippedAssetTypes.filter(s => s.assetType !== payload.assetType);
    }
  } else {
    // Full task unskip
    task.skipMetadata = undefined;
    task.skippedAssetTypes = []; // Clear all skipped groups if unskipping the whole task
  }

  // Determine status after unskip
  if (task.ratings && task.ratings.length > 0) {
    if (task.category === 'Roadway') {
      const ratedRoadwayGroups = new Set((task.ratings || []).filter(r => r.group).map(r => r.group));
      const skippedGroups = new Set((task.skippedAssetTypes || []).map(s => s.assetType));
      const requiredRoadwayGroups = ['Pavement', 'Shoulder', 'Kerb', 'Pavement Markings', 'ROW', 'Median Plantation'];
      const isRoadwayCompleted = requiredRoadwayGroups.every(g => ratedRoadwayGroups.has(g) || skippedGroups.has(g));
      
      task.status = isRoadwayCompleted ? 'COMPLETED' : 'IN_PROGRESS';
    } else {
      const totalAssetTypes = new Set((task.parameters || []).map(p => p.assetType)).size;
      const ratedAssetTypes = new Set((task.ratings || []).map(r => r.assetType)).size;
      const skippedCount = task.skippedAssetTypes ? task.skippedAssetTypes.length : 0;
      
      if (totalAssetTypes > 0 && (ratedAssetTypes + skippedCount) >= totalAssetTypes) {
        task.status = 'COMPLETED';
      } else {
        task.status = 'IN_PROGRESS';
      }
    }
  } else {
    task.status = 'READY_FOR_RATING';
  }

  await task.save();

  // Re-evaluate batch status
  const batch = await InspectionBatch.findById(task.batchId);
  if (batch && batch.status === 'COMPLETED') {
    batch.status = 'IN_PROGRESS';
    await batch.save();
    
    // Also mark assignment as In Progress if it was completed
    if (user && user.role === 'User') {
       await WorkAssignment.updateMany(
         { batchId: task.batchId, assignedTo: user._id, status: 'Completed' },
         { $set: { status: 'In Progress', completedTime: null } }
       );
    }
  }

  return task;
};

module.exports = { getProjectRatings, computeOverallRating, getRatingSummary, getVersionHistory, getReadyBatches, getBatchTasks, saveTaskRatings, skipTask, unskipTask, exportRatingsCSV };
