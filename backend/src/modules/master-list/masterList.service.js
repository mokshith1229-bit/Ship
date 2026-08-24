const masterListRepository = require('./masterList.repository');
const MasterList = require('../../models/MasterList.model');
const xlsx = require('xlsx');

class MasterListService {
  async importMasterList(fileBuffer, projectName, importMode, user, originalFileName) {
    if (!fileBuffer) throw new Error('No file uploaded');
    if (!projectName) throw new Error('Project name is required');
    if (!['append', 'replace'].includes(importMode)) {
      throw new Error('Invalid import mode. Must be "append" or "replace"');
    }

    const ImportBatch = require('../../models/ImportBatch.model');

    // Create the batch record
    const importBatch = new ImportBatch({
      originalFileName: originalFileName || 'Uploaded File',
      project: projectName,
      uploadedBy: user ? user._id : null,
      status: 'Processing'
    });
    await importBatch.save();

    // 1. Parse Excel/CSV
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    let rows = [];
    
    // Process all sheets, not just the first one
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      rows = rows.concat(sheetRows);
    }

    if (!rows || rows.length === 0) {
      importBatch.status = 'Failed';
      await importBatch.save();
      throw new Error('File is empty or could not be parsed.');
    }

    importBatch.totalRows = rows.length;

    // 2. Fetch existing for deduplication (if append)
    let existingSet = new Set();
    if (importMode === 'replace') {
      await MasterList.deleteMany({ project: projectName });
    } else {
      const existingRecords = await MasterList.find({ project: projectName })
        .select('chainage parameter')
        .lean();
      
      existingRecords.forEach(r => {
        existingSet.add(`${r.chainage}_${r.parameter}`.toLowerCase().trim());
      });
    }

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;
    const validDocsToInsert = [];
    
    const localFileSet = new Set();

    // 3. Process rows
    for (const row of rows) {
      const getVal = (keyNames) => {
        const key = Object.keys(row).find(k => keyNames.some(n => k.toLowerCase().includes(n.toLowerCase())));
        return key ? String(row[key]).trim() : '';
      };

      let category = getVal(['category']);
      let assetType = getVal(['asset']);
      let assetSubType = getVal(['sign board type', 'asset sub type', 'subtype', 'sub type']);
      let chainage = getVal(['chainage', 'location']);
      let parameter = getVal(['parameter', 'question']);
      
      let roadType = getVal(['road type', 'roadtype']) || 'N/A';
      let direction = getVal(['direction']) || 'N/A';
      let placement = getVal(['placement']) || '';

      // Auto-correct shifted columns for missing SubType (e.g. Lightings in malformed excel)
      if (!parameter && direction && direction !== 'N/A') {
        const validDirections = ['lhs', 'rhs', 'both', 'n/a', 'median', 'l.h.s', 'r.h.s', 'm', 'l', 'r'];
        if (!validDirections.includes(direction.toLowerCase().trim())) {
          // The parameter value got shifted into the direction column!
          parameter = direction;
          direction = roadType;
          roadType = assetSubType;
          assetSubType = '';
        }
      }

      // Final fallback if direction wasn't provided or shifted into placement
      if (!parameter && placement && placement !== 'N/A') {
          parameter = placement;
          placement = direction;
          direction = roadType;
          roadType = assetSubType;
          assetSubType = '';
      }

      if (!category || !assetType || !chainage || !parameter) {
        invalid++;
        continue;
      }

      const dedupKey = `${chainage}_${parameter}`.toLowerCase();
      localFileSet.add(dedupKey);
      
      let imageRequirement = 'DAY';
      const paramLower = parameter.toLowerCase();
      
      if (assetType.toLowerCase().includes('pavement markings') && paramLower.includes('night visibility')) {
        imageRequirement = 'NIGHT';
      } else if (assetType.toLowerCase().includes('signages') && paramLower.includes('retro reflectivity')) {
        imageRequirement = 'NIGHT';
      } else if (assetType.toLowerCase().includes('traffic blinkers and signals') && paramLower.includes('functional condition')) {
        imageRequirement = 'NIGHT';
      } else if (assetType.toLowerCase().includes('lightings') && paramLower.includes('functional condition')) {
        imageRequirement = 'NIGHT';
      } else if (assetType.toLowerCase().includes('delineators') && paramLower.includes('functional condition')) {
        imageRequirement = 'NIGHT';
      }

      validDocsToInsert.push({
        project: projectName,
        category,
        assetType,
        assetSubType,
        chainage,
        parameter,
        roadType,
        direction,
        placement,
        imageRequirement,
        importBatchId: importBatch._id,
        questionId: `Q-${Date.now()}-${Math.floor(Math.random() * 100000)}-${validDocsToInsert.length}`,
        status: 'Active'
      });
    }

    const newMasterListIds = [];

    // 4. Bulk Insert
    if (validDocsToInsert.length > 0) {
      const chunkSize = 5000;
      for (let i = 0; i < validDocsToInsert.length; i += chunkSize) {
        const chunk = validDocsToInsert.slice(i, i + chunkSize);
        const insertedDocs = await MasterList.insertMany(chunk, { ordered: false });
        newMasterListIds.push(...insertedDocs.map(doc => doc._id));
      }
      imported = validDocsToInsert.length;
    }

    importBatch.imported = imported;
    importBatch.duplicates = duplicates;
    importBatch.invalid = invalid;
    importBatch.status = 'Completed';
    await importBatch.save();

    return {
      totalRows: rows.length,
      imported,
      duplicates,
      invalid,
      newMasterListIds,
      importBatchId: importBatch._id
    };
  }

  async getImportHistory(project) {
    const ImportBatch = require('../../models/ImportBatch.model');
    const filter = {};
    if (project) filter.project = project;
    return ImportBatch.find(filter).sort({ createdAt: -1 }).populate('uploadedBy', 'name');
  }

  async previewDeleteImport(batchId) {
    const ImportBatch = require('../../models/ImportBatch.model');
    const InspectionTask = require('../../models/InspectionTask.model');
    
    const batch = await ImportBatch.findById(batchId);
    if (!batch) throw new Error('Import batch not found');

    const records = await MasterList.find({ importBatchId: batchId }).select('_id').lean();
    const itemIds = records.map(r => r._id);

    const tasks = await InspectionTask.find({ parameters: { $in: itemIds } });
    
    let referencedTasks = tasks.length;
    let referencedRatings = 0;
    let referencedImages = 0;

    for (const task of tasks) {
      if (task.ratings && task.ratings.length > 0) {
        referencedRatings += task.ratings.length;
      }
      if (task.image && task.image.url) {
        referencedImages++;
      } else if (task.status !== 'PENDING_IMAGE') {
        referencedImages++; // Might have an image or passed image stage
      }
    }

    return {
      batch,
      recordsCount: itemIds.length,
      referencedTasks,
      referencedRatings,
      referencedImages
    };
  }

  async deleteImportBatch(batchId) {
    const ImportBatch = require('../../models/ImportBatch.model');
    const batch = await ImportBatch.findById(batchId);
    if (!batch) throw new Error('Import batch not found');

    const records = await MasterList.find({ importBatchId: batchId }).select('_id').lean();
    const itemIds = records.map(r => r._id);

    if (itemIds.length > 0) {
      await this._cleanupTasksForDeletedParameters(itemIds);
      await MasterList.deleteMany({ importBatchId: batchId });
    }
    
    await ImportBatch.findByIdAndDelete(batchId);
    
    return { success: true, message: 'Import batch and associated records deleted' };
  }

  /**
   * Cancel an import by deleting the newly inserted master list IDs
   */
  async cancelImport(newMasterListIds) {
    if (!newMasterListIds || newMasterListIds.length === 0) return;
    await MasterList.deleteMany({ _id: { $in: newMasterListIds } });
    return { success: true, message: 'Import cancelled and rolled back' };
  }

  /**
   * Get all master list records based on query parameters
   */
  async getMasterList(query) {
    const filter = {};
    
    // Apply filters if provided
    if (query.project) filter.project = query.project;
    if (query.category) filter.category = query.category;
    if (query.assetType) filter.assetType = query.assetType;
    if (query.roadType) filter.roadType = query.roadType;
    if (query.direction) filter.direction = query.direction;
    if (query.placement) filter.placement = query.placement;
    if (query.status) filter.status = query.status;

    return masterListRepository.find(filter);
  }

  /**
   * Get dashboard statistics
   */
  async getStats() {
    return masterListRepository.getStats();
  }

  /**
   * Get list of unique categories
   */
  async getCategories() {
    return masterListRepository.distinct('category', { status: 'Active' });
  }

  /**
   * Get list of unique asset types (optionally filtered by category)
   */
  async getAssetTypes(category) {
    const filter = { status: 'Active' };
    if (category) filter.category = category;
    return masterListRepository.distinct('assetType', filter);
  }

  /**
   * Get list of unique road types for a project
   */
  async getRoadTypes(project) {
    const filter = { status: 'Active' };
    if (project) filter.project = project;
    return masterListRepository.distinct('roadType', filter);
  }

  /**
   * Get list of unique projects
   */
  async getProjects() {
    return masterListRepository.distinct('project', { status: 'Active' });
  }

  /**
   * Update a Master List Item
   */
  async updateMasterListItem(id, updateData) {
    const updated = await MasterList.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) throw new Error('Master list item not found');
    return updated;
  }

  /**
   * Helper to clean up tasks and cloudinary images when a master list item is deleted
   */
  async _cleanupTasksForDeletedParameters(itemIds) {
    const InspectionTask = require('../../models/InspectionTask.model');
    const { cloudinary } = require('../../config/cloudinary');
    
    // Find all tasks that have these master list items in their parameters
    const tasks = await InspectionTask.find({ parameters: { $in: itemIds } });
    
    for (const task of tasks) {
      // Remove deleted item IDs from task parameters
      task.parameters = task.parameters.filter(p => !itemIds.includes(p.toString()));
      
      if (task.parameters.length === 0) {
        // If task has 0 parameters left, it is orphaned. Delete image from Cloudinary
        if (task.image && task.image.cloudinaryUrl) {
          try {
            // Reconstruct public_id
            // the folder is hirate/survey-images/project/batch_id
            // the public_id is chainage_XXX
            const publicId = `hirate/survey-images/${task.project}/${task.batchId}/chainage_${task.chainage.replace(/\\./g, '_')}`;
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error(`Failed to delete cloudinary image for task ${task._id}:`, err);
          }
        }
        // Delete the task entirely
        await InspectionTask.findByIdAndDelete(task._id);
      } else {
        // Save the updated parameters
        await task.save();
      }
    }
  }

  /**
   * Delete a single Master List Item
   */
  async deleteMasterListItem(id) {
    const item = await MasterList.findById(id);
    if (!item) throw new Error('Master list item not found');
    
    await this._cleanupTasksForDeletedParameters([id]);
    await MasterList.findByIdAndDelete(id);
    
    return { success: true, message: 'Item deleted successfully' };
  }

  /**
   * Retroactively fix imageRequirement for all existing Master List records
   * by applying the same auto-tagging logic used during import.
   * This corrects records imported before the NIGHT tagging was added.
   */
  async fixImageRequirements(project) {
    const filter = project ? { project } : {};
    const records = await MasterList.find(filter).select('_id assetType parameter').lean();

    let updated = 0;
    const nightConditions = (assetType, parameter) => {
      const aLow = assetType.toLowerCase();
      const pLow = parameter.toLowerCase();
      if (aLow.includes('pavement markings') && pLow.includes('night visibility')) return true;
      if (aLow.includes('signages') && pLow.includes('retro reflectivity')) return true;
      if (aLow.includes('traffic blinkers and signals') && pLow.includes('functional condition')) return true;
      if (aLow.includes('lightings') && pLow.includes('functional condition')) return true;
      if (aLow.includes('delineators') && pLow.includes('functional condition')) return true;
      return false;
    };

    const bulkOps = [];
    for (const record of records) {
      const isNight = nightConditions(record.assetType || '', record.parameter || '');
      bulkOps.push({
        updateOne: {
          filter: { _id: record._id },
          update: { $set: { imageRequirement: isNight ? 'NIGHT' : 'DAY' } }
        }
      });
    }

    if (bulkOps.length > 0) {
      const result = await MasterList.bulkWrite(bulkOps);
      updated = result.modifiedCount;
    }

    return {
      total: records.length,
      updated,
      project: project || 'ALL'
    };
  }

  /**
   * Delete entire project Master List
   */
  async deleteProjectMasterList(projectName) {
    const { cloudinary } = require('../../config/cloudinary');
    const InspectionTask = require('../../models/InspectionTask.model');
    const InspectionBatch = require('../../models/InspectionBatch.model');
    const WorkAssignment = require('../../models/WorkAssignment.model');

    try {
      // Delete all images in the project's folder on Cloudinary
      await cloudinary.api.delete_resources_by_prefix(`hirate/survey-images/${projectName}/`);
    } catch (err) {
      console.error(`Failed to delete cloudinary resources for project ${projectName}:`, err);
    }

    // Delete all associated collections for this project
    await InspectionTask.deleteMany({ project: projectName });
    await InspectionBatch.deleteMany({ project: projectName });
    await WorkAssignment.deleteMany({ project: projectName });
    await MasterList.deleteMany({ project: projectName });
    
    return { success: true, message: 'Project and all associated data deleted successfully' };
  }
}

module.exports = new MasterListService();
