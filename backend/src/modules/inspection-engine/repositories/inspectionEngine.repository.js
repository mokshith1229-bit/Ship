'use strict';

const InspectionBatch = require('../../../models/InspectionBatch.model');
const InspectionTask = require('../../../models/InspectionTask.model');
const mongoose = require('mongoose');

class InspectionEngineRepository {
  async createBatch(batchData, tasksData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create the Batch
      const batch = new InspectionBatch(batchData);
      await batch.save({ session });

      // 2. Attach batchId to tasks
      const tasksToInsert = tasksData.map(t => ({
        ...t,
        batchId: batch._id
      }));

      // 3. Bulk insert the tasks
      await InspectionTask.insertMany(tasksToInsert, { session });

      await session.commitTransaction();
      session.endSession();

      return batch;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async listBatches(filters = {}) {
    return InspectionBatch.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getBatchDetails(batchId) {
    const batch = await InspectionBatch.findById(batchId)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!batch) return null;

    const tasks = await InspectionTask.find({ batchId })
      .populate('parameters')
      .lean();

    return { ...batch, tasks };
  }

  async deleteBatch(batchId) {
    const { cloudinary } = require('../../../config/cloudinary');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the batch to get the project name for the Cloudinary folder prefix
      const batch = await InspectionBatch.findById(batchId).session(session);
      if (!batch) {
        throw new Error('Batch not found');
      }

      // Delete images from Cloudinary using the folder prefix
      // Folder structure is: hirate/survey-images/{project}/{batchId}
      try {
        const prefix = `hirate/survey-images/${batch.project}/${batch._id}/`;
        await cloudinary.api.delete_resources_by_prefix(prefix);
        // Also delete the folder itself
        await cloudinary.api.delete_folder(prefix.slice(0, -1));
      } catch (cloudErr) {
        console.error(`Failed to delete Cloudinary resources for batch ${batch._id}:`, cloudErr);
        // We log the error but don't fail the transaction, ensuring DB records are still cleaned up
      }

      await InspectionTask.deleteMany({ batchId }, { session });
      await InspectionBatch.findByIdAndDelete(batchId, { session });

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getExtractionReport(batchId) {
    const tasks = await InspectionTask.find({ batchId })
      .select('chainage status extractionDiagnostics assetType roadType')
      .populate('extractionDiagnostics.surveyAssetId', 'assetName')
      .lean();
    
    return tasks;
  }

  async getPreviouslyInspectedMasterListIds(project) {
    const lastResetBatch = await InspectionBatch.findOne({ 
      project, 
      isSamplingHistoryReset: true 
    }).sort({ createdAt: -1 }).lean();

    const taskQuery = { project };
    if (lastResetBatch) {
      taskQuery.createdAt = { $gte: lastResetBatch.createdAt };
    }

    const tasks = await InspectionTask.find(taskQuery).select('parameters').lean();

    const inspectedIds = new Set();
    tasks.forEach(task => {
      if (task.parameters && Array.isArray(task.parameters)) {
        task.parameters.forEach(p => inspectedIds.add(p.toString()));
      }
    });

    return Array.from(inspectedIds);
  }
}

module.exports = new InspectionEngineRepository();
