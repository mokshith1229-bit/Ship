const MasterList = require('../../models/MasterList.model');
const InspectionTask = require('../../models/InspectionTask.model');
const InspectionBatch = require('../../models/InspectionBatch.model');
const ExtractionTask = require('../../models/ExtractionTask.model');
const surveyProcessingService = require('../survey-processing/services/surveyProcessing.service');
const SurveyAsset = require('../../models/SurveyAsset.model');

class CycleExtensionService {

  _getTaskIdentity(batchId, q) {
    return `${batchId}_${q.project}_${q.chainage}_${q.category}_${q.assetType}_${q.assetSubType || ''}_${q.direction || 'N/A'}_${q.roadType || 'N/A'}_${q.imageRequirement || 'DAY'}`;
  }

  async _analyzeExtension(questions, batchId, project) {
    // Group new master list items into task representations
    const taskGroups = new Map();
    for (const q of questions) {
      const identity = this._getTaskIdentity(batchId, q);
      if (!taskGroups.has(identity)) {
        taskGroups.set(identity, {
          project: q.project,
          category: q.category,
          chainage: q.chainage,
          assetType: q.assetType,
          assetSubType: q.assetSubType || '',
          direction: q.direction || 'N/A',
          roadType: q.roadType || 'N/A',
          imageRequirement: q.imageRequirement || 'DAY',
          parameters: []
        });
      }
      taskGroups.get(identity).parameters.push(q);
    }

    // Check existing tasks for this batch
    const existingTasks = await InspectionTask.find({ batchId });
    const existingTaskMap = new Map();
    for (const task of existingTasks) {
      const identity = `${batchId}_${task.project}_${task.chainage}_${task.category}_${task.assetType}_${task.assetSubType || ''}_${task.direction || 'N/A'}_${task.roadType || 'N/A'}_${task.imageRequirement || 'DAY'}`;
      existingTaskMap.set(identity, task);
    }

    const tasksToUpdate = [];
    const tasksToCreate = [];

    for (const [identity, group] of taskGroups.entries()) {
      if (existingTaskMap.has(identity)) {
        tasksToUpdate.push({
          task: existingTaskMap.get(identity),
          newParameters: group.parameters
        });
      } else {
        tasksToCreate.push(group);
      }
    }

    return {
      questions,
      tasksToUpdate,
      tasksToCreate
    };
  }

  async previewAddToCycle(newMasterListIds, batchId, project) {
    const batch = await InspectionBatch.findById(batchId);
    if (!batch) throw new Error('Inspection cycle not found');

    const questions = await MasterList.find({ _id: { $in: newMasterListIds } }).lean();
    const analysis = await this._analyzeExtension(questions, batchId, project);

    // Prepare table view
    const tableData = [];
    for (const item of analysis.tasksToUpdate) {
      for (const q of item.newParameters) {
        tableData.push({
          masterListId: q.questionId,
          assetType: q.assetType,
          chainage: q.chainage,
          existingTask: 'Yes',
          action: 'ADD PARAMETER'
        });
      }
    }
    
    for (const item of analysis.tasksToCreate) {
      for (const q of item.parameters) {
        tableData.push({
          masterListId: q.questionId,
          assetType: q.assetType,
          chainage: q.chainage,
          existingTask: 'No',
          action: 'CREATE TASK'
        });
      }
    }

    return {
      summary: {
        newMasterListParameters: analysis.questions.length,
        existingTasksToUpdate: analysis.tasksToUpdate.length,
        newInspectionTasksToCreate: analysis.tasksToCreate.length,
        imagesToExtract: analysis.tasksToCreate.length
      },
      tableData
    };
  }

  async executeAddToCycle(newMasterListIds, batchId, project, user) {
    const batch = await InspectionBatch.findById(batchId);
    if (!batch) throw new Error('Inspection cycle not found');

    const questions = await MasterList.find({ _id: { $in: newMasterListIds } }).lean();
    if (!questions || questions.length === 0) {
      throw new Error('No valid Master List records found');
    }

    // Duplicate Task Check
    // If an ExtractionTask already exists with exactly the same masterListIds and same inspectionId
    // that is Pending, Processing or Completed, reject.
    const sortedIds = [...newMasterListIds].map(id => id.toString()).sort();
    
    const existingTasks = await ExtractionTask.find({
      inspectionId: batch._id,
      status: { $in: ['Pending', 'Processing', 'Completed'] }
    });

    for (const et of existingTasks) {
      const etSortedIds = et.originalMasterListIds.map(id => id.toString()).sort();
      if (etSortedIds.length === sortedIds.length && etSortedIds.every((v, i) => v === sortedIds[i])) {
        throw new Error('An extraction task for these identical parameters already exists in this cycle.');
      }
    }

    const task = new ExtractionTask({
      inspectionId: batch._id,
      project,
      originalMasterListIds: newMasterListIds,
      selectedModelData: questions,
      status: 'Pending',
      createdBy: user ? user._id : null
    });
    
    await task.save();

    return {
      summary: {
        existingTasksUpdated: 0,
        newTasksCreated: 0,
        imagesExtracted: 0,
        newUnratedParameters: questions.length
      },
      message: 'Extraction task created successfully.',
      extractionTaskId: task._id
    };
  }

  async processExtractionTask(taskId, user) {
    const task = await ExtractionTask.findById(taskId);
    if (!task) throw new Error('Extraction task not found');

    if (task.status === 'Completed') {
      throw new Error('Extraction task is already completed');
    }
    
    if (task.status === 'Processing') {
      throw new Error('Extraction task is currently processing');
    }

    task.status = 'Processing';
    task.startedAt = new Date();
    task.errorMessage = null;
    await task.save();

    try {
      const batch = await InspectionBatch.findById(task.inspectionId);
      if (!batch) throw new Error('Target inspection cycle not found');

      // Use stored snapshot data (task.selectedModelData)
      const analysis = await this._analyzeExtension(task.selectedModelData, batch._id.toString(), task.project);

      // 1. Update Existing Tasks
      let updatedTasksCount = 0;
      for (const item of analysis.tasksToUpdate) {
        const inspectionTask = item.task;
        const paramIds = item.newParameters.map(p => p._id);
        
        let added = false;
        // Append only unique new masterListIds
        for (const pid of paramIds) {
          if (!inspectionTask.parameters.some(existing => existing.toString() === pid.toString())) {
            inspectionTask.parameters.push(pid);
            added = true;
          }
        }
        
        if (added && inspectionTask.status === 'COMPLETED') {
          inspectionTask.status = 'READY_FOR_RATING';
        }
        
        await inspectionTask.save();
        updatedTasksCount++;
      }

      // 2. Create New Tasks
      const newTasks = [];
      for (const group of analysis.tasksToCreate) {
        const newTask = {
          batchId: batch._id,
          project: group.project,
          category: group.category,
          chainage: group.chainage,
          assetType: group.assetType,
          assetSubType: group.assetSubType,
          direction: group.direction,
          roadType: group.roadType,
          imageRequirement: group.imageRequirement,
          parameters: group.parameters.map(p => p._id),
          ratings: [], // New task starts unrated
          status: 'PENDING_IMAGE'
        };
        newTasks.push(newTask);
      }

      let createdTasks = [];
      if (newTasks.length > 0) {
        createdTasks = await InspectionTask.insertMany(newTasks);
      }

      // 3. Update Batch Stats
      batch.selectedQuestionsCount += analysis.questions.length;
      
      // If the batch was previously COMPLETED, revert it so the user can rate the new parameters
      if (batch.status === 'COMPLETED' && analysis.questions.length > 0) {
        batch.status = 'IN_PROGRESS';
      }
      
      await batch.save();

      // 4. Trigger Image Extraction for newly created tasks AND existing tasks that need it
      let tasksNeedingExtraction = [...createdTasks];
      for (const item of analysis.tasksToUpdate) {
        if (item.task.status === 'PENDING_IMAGE' || item.task.status === 'EXTRACTION_FAILED') {
          tasksNeedingExtraction.push(item.task);
        }
      }

      if (tasksNeedingExtraction.length > 0) {
        const assets = await SurveyAsset.find({ project: task.project, status: { $in: ['READY', 'COMPLETED'] } });
        
        // Fire and forget
        surveyProcessingService.processImagesInBackground(task.project, user, {
          assets,
          tasks: tasksNeedingExtraction,
          batchIds: [batch._id]
        }).then(async () => {
          task.status = 'Completed';
          task.completedAt = new Date();
          await task.save();
        }).catch(async (err) => {
          console.error('Extraction trigger failed for tasks:', err);
          task.status = 'Failed';
          task.errorMessage = err.message || 'Image extraction failed';
          await task.save();
        });
        
        // Return immediately to prevent HTTP timeout
        return { success: true, message: 'Extraction started in background' };
      }

      task.status = 'Completed';
      task.completedAt = new Date();
      await task.save();

      return { success: true, message: 'Extraction completed' };

    } catch (error) {
      task.status = 'Failed';
      task.errorMessage = error.message || 'Unknown error occurred during extraction';
      task.retryCount = (task.retryCount || 0) + 1;
      await task.save();
      throw error;
    }
  }

}

module.exports = new CycleExtensionService();
