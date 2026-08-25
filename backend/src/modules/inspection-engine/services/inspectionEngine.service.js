'use strict';

const inspectionEngineRepository = require('../repositories/inspectionEngine.repository');
const masterListRepository = require('../../master-list/masterList.repository');
const SamplingStrategyFactory = require('./strategies/samplingStrategyFactory');
const SurveyAsset = require('../../../models/SurveyAsset.model');
const InspectionTask = require('../../../models/InspectionTask.model');
const fs = require('fs');
const { ROADWAY_PARAMETER_CONFIG } = require('../../../constants/roadwayConfig');

class InspectionEngineService {
  async createBatch(userId, batchData) {
    const { 
      project, 
      samplingPercentage, 
      samplingStrategy = 'RANDOM', 
      categories,
      assetTypes,
      excludePreviouslyInspected = true, 
      resetHistory = false 
    } = batchData;

    if (!project) throw new Error('Project is required to create a batch');
    if (!samplingPercentage || samplingPercentage <= 0 || samplingPercentage > 100) {
      throw new Error('Sampling percentage must be between 1 and 100');
    }

    // 1. Fetch Master List for this project (Active questions only)
    const filter = { project, status: 'Active' };
    if (categories && categories.length > 0) filter.category = categories;
    if (assetTypes && assetTypes.length > 0) filter.assetType = assetTypes;

    let masterListPopulation = await masterListRepository.getMasterList(filter);

    // Add temporary logs for RSF check
    if (categories && categories.includes('Road Signage and Furniture')) {
      const MasterList = require('../../../models/MasterList.model');
      console.log("When fetching RSF (createBatch):");
      console.log("Total MasterList records:", await MasterList.countDocuments({ project }));
      console.log("RSF records found:", await MasterList.countDocuments({ project, category: 'Road Signage and Furniture' }));
      console.log("Project filtered records:", await MasterList.countDocuments({ project, status: 'Active' }));
      console.log("Category filtered records:", await MasterList.countDocuments({ project, status: 'Active', category: 'Road Signage and Furniture' }));
      console.log("Final RSF questions returned:", masterListPopulation.length);
      // We limit to 5 just for logging size
      console.log("Print the actual IDs and chainages (first 5):", masterListPopulation.slice(0, 5).map(q => ({ id: q._id, chainage: q.chainage })));
    }

    if (!masterListPopulation || masterListPopulation.length === 0) {
      throw new Error(`No active master list questions found for project: ${project}${categories ? ` and selected categories/assets` : ''}`);
    }

    // 1.5 Exclude previously inspected questions if requested
    if (excludePreviouslyInspected) {
      const previouslyInspectedIds = await inspectionEngineRepository.getPreviouslyInspectedMasterListIds(project);
      
      if (previouslyInspectedIds.length > 0) {
        masterListPopulation = masterListPopulation.filter(q => !previouslyInspectedIds.includes(q._id.toString()));
      }

      if (masterListPopulation.length === 0) {
        const err = new Error('All Master List questions for this project have already been inspected.');
        err.code = 'ALL_INSPECTED';
        throw err;
      }
    }

    // 2. Select Sampling Strategy
    // (Moved to step 4)

    // 3. Group Master List into Physical Assets
    const assetsMap = new Map();
    masterListPopulation.forEach(q => {
      const key = `${q.project}_${q.chainage}_${q.assetType}_${q.assetSubType || ''}_${q.roadType || ''}`;
      if (!assetsMap.has(key)) {
        assetsMap.set(key, {
          project: q.project,
          chainage: q.chainage,
          assetType: q.assetType,
          assetSubType: q.assetSubType,
          roadType: q.roadType,
          parameters: []
        });
      }
      assetsMap.get(key).parameters.push(q);
    });

    const physicalAssets = Array.from(assetsMap.values());

    // 4. Select Sampling Strategy and Generate Sample (Sampling ASSETS, not individual parameters)
    const strategy = SamplingStrategyFactory.getStrategy(samplingStrategy);
    const sampledAssets = strategy.sample(physicalAssets, samplingPercentage);

    if (sampledAssets.length === 0) {
      throw new Error('Sampling resulted in 0 tasks. Please adjust your percentage.');
    }

    // 5. Calculate Unique Chainages
    const uniqueChainages = new Set(sampledAssets.map(a => a.chainage));

    // Calculate total questions in the sample
    let selectedQuestionsCount = 0;
    sampledAssets.forEach(a => {
      selectedQuestionsCount += a.parameters.length;
    });

    // 6. Prepare Batch Data
    const name = `Batch-${project}-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)}`;
    
    const newBatchData = {
      name,
      project,
      categories: categories || [],
      assetTypes: assetTypes || [],
      samplingPercentage,
      samplingStrategy,
      totalMasterQuestions: masterListPopulation.length,
      selectedQuestionsCount,
      uniqueChainagesCount: uniqueChainages.size,
      status: 'WAITING_FOR_IMAGES',
      createdBy: userId,
      isSamplingHistoryReset: resetHistory
    };

    // 7. Prepare Task Data - Split by imageRequirement so survey processing can match surveyType
    const tasksData = [];
    sampledAssets.forEach(asset => {
      // Split the asset's parameters by image requirement (from Master List)
      const dayParams = asset.parameters.filter(p => (p.imageRequirement || 'DAY') !== 'NIGHT');
      const nightParams = asset.parameters.filter(p => p.imageRequirement === 'NIGHT');

      // Create a DAY task if there are any DAY parameters
      if (dayParams.length > 0) {
        tasksData.push({
          project: asset.project,
          chainage: asset.chainage,
          assetType: asset.assetType,
          assetSubType: asset.assetSubType,
          roadType: asset.roadType,
          imageRequirement: 'DAY',
          parameters: dayParams.map(p => p._id),
          status: 'PENDING_IMAGE'
        });
      }

      // Create a NIGHT task if there are any NIGHT parameters
      if (nightParams.length > 0) {
        tasksData.push({
          project: asset.project,
          chainage: asset.chainage,
          assetType: asset.assetType,
          assetSubType: asset.assetSubType,
          roadType: asset.roadType,
          imageRequirement: 'NIGHT',
          parameters: nightParams.map(p => p._id),
          status: 'PENDING_IMAGE'
        });
      }
    });

    // 7. Save to DB transactionally
    const batch = await inspectionEngineRepository.createBatch(newBatchData, tasksData);
    
    return batch;
  }

  _parseAllVttChainages(vttPath) {
    try {
      const content = fs.readFileSync(vttPath, 'utf8');
      const blocks = content.trim().split(/\n\s*\n/);
      const metadataPattern = /Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+),\s*Speed:\s*([0-9.-]+)[kK]m\/hr\s*chainage:\s*([0-9.-]+)/i;
      
      const chainages = [];
      for (const block of blocks) {
        const mdMatch = block.match(metadataPattern);
        if (mdMatch) {
          chainages.push(parseFloat(mdMatch[4]));
        }
      }
      return chainages.sort((a, b) => a - b);
    } catch (e) {
      throw new Error('Failed to parse VTT chainages');
    }
  }

  _getClosestChainage(target, chainages) {
    if (!chainages || chainages.length === 0) return null;
    let closest = chainages[0];
    let minDiff = Math.abs(target - closest);
    for (let i = 1; i < chainages.length; i++) {
      const diff = Math.abs(target - chainages[i]);
      if (diff < minDiff) {
        closest = chainages[i];
        minDiff = diff;
      }
    }
    return closest;
  }

  async _calculateRoadwaySampling(project, surveyAssetId, targetChainages) {
    let assets = [];
    if (surveyAssetId === 'all') {
      assets = await SurveyAsset.find({ project, 'vtt.path': { $exists: true, $ne: null } });
    } else {
      const asset = await SurveyAsset.findOne({ _id: surveyAssetId, project });
      if (asset) assets.push(asset);
    }
    
    if (assets.length === 0) throw new Error('No valid survey assets found');

    const availableChainages = [];
    const chainageSourceMap = new Map();

    for (const asset of assets) {
      try {
        const assetChainages = this._parseAllVttChainages(asset.vtt.path);
        for (const c of assetChainages) {
          availableChainages.push(c);
          if (!chainageSourceMap.has(c)) {
            chainageSourceMap.set(c, asset);
          }
        }
      } catch (err) {
        console.warn(`Failed to parse VTT for asset ${asset._id}: ${err.message}`);
      }
    }
    
    if (availableChainages.length === 0) throw new Error('No chainages found in VTT(s)');

    availableChainages.sort((a, b) => a - b);

    const matchedChainages = new Set();
    const sourceSurveyIds = new Map(); // matched chainage (number) -> surveyAssetId

    for (const target of targetChainages) {
      const closest = this._getClosestChainage(target, availableChainages);
      if (closest !== null) {
        matchedChainages.add(closest);
        const sourceAsset = chainageSourceMap.get(closest);
        if (sourceAsset) {
          sourceSurveyIds.set(closest, sourceAsset._id.toString());
        }
      }
    }

    const uniqueMatched = Array.from(matchedChainages);

    // Check which ones already have images extracted in previous InspectionTasks
    const chainageQueries = uniqueMatched.flatMap(c => {
      const cNum = Number(c);
      return [
        cNum.toString(),
        cNum.toFixed(1),
        cNum.toFixed(2),
        cNum.toFixed(3)
      ];
    });

    const existingTasks = await InspectionTask.find({
      project,
      chainage: { $in: chainageQueries },
      'image.cloudinaryUrl': { $exists: true, $ne: null }
    }).select('chainage image.cloudinaryUrl extractionDiagnostics');

    const existingImageMap = {};
    for (const task of existingTasks) {
      const taskChainageNum = parseFloat(task.chainage);
      if (isNaN(taskChainageNum)) continue;
      
      const chainageKey = taskChainageNum.toFixed(3);

      if (surveyAssetId === 'all') {
        if (!existingImageMap[chainageKey]) {
          existingImageMap[chainageKey] = task.image.cloudinaryUrl;
        }
      } else {
        if (!existingImageMap[chainageKey] || (task.extractionDiagnostics && task.extractionDiagnostics.surveyAssetId?.toString() === surveyAssetId)) {
          existingImageMap[chainageKey] = task.image.cloudinaryUrl;
        }
      }
    }

    const matchedCount = uniqueMatched.length;
    const existingCount = Object.keys(existingImageMap).length;
    const missingCount = matchedCount - existingCount;

    return {
      surveyAssetId,
      surveyName: surveyAssetId === 'all' ? 'All Videos' : assets[0].assetName,
      surveyType: surveyAssetId === 'all' ? 'MIXED' : assets[0].surveyType,
      totalAvailableImages: availableChainages.length,
      matchedImages: matchedCount,
      existingImages: existingCount,
      missingExtractionImages: missingCount,
      uniqueMatchedChainages: uniqueMatched,
      existingImageMap,
      sourceSurveyIds
    };
  }

  async _processStreams(project, streams, startChainage, endChainage, intervalMetres) {
    const minC = Math.min(startChainage, endChainage);
    const maxC = Math.max(startChainage, endChainage);
    const interval = intervalMetres / 1000;
    
    // Fetch RSF questions for intersection
    const MasterList = require('../../../models/MasterList.model');
    const rsfQuestions = await MasterList.find({ project, status: 'Active', category: 'Road Signage and Furniture' });
    const rsfChainagesMap = new Map();
    for (const q of rsfQuestions) {
      const c = parseFloat(parseFloat(q.chainage).toFixed(3));
      if (!isNaN(c) && c >= minC && c <= maxC) {
        if (!rsfChainagesMap.has(c)) rsfChainagesMap.set(c, []);
        rsfChainagesMap.get(c).push(q);
      }
    }

    const SurveyAsset = require('../../../models/SurveyAsset.model');
    const InspectionTask = require('../../../models/InspectionTask.model');
    const { ROADWAY_PARAMETER_CONFIG } = require('../../../constants/roadwayConfig');

    const streamResults = [];
    let totalQuestions = 0;
    let totalTasks = 0;
    let totalExistingImages = 0;
    let totalMissingImages = 0;
    const allTasksData = []; // for createRoadwayBatch

    for (const stream of streams) {
      // Determine query for assets
      let assetQuery = { project, 'coverage.startChainage': { $exists: true, $ne: null } };
      let expectedDirection = '-';
      let expectedRoadType = 'Main Carriageway';
      
      if (stream === 'LHS') {
        assetQuery.roadDirection = 'LHS';
        assetQuery.roadType = { $ne: 'SR' };
        expectedDirection = 'LHS';
      } else if (stream === 'RHS') {
        assetQuery.roadDirection = 'RHS';
        assetQuery.roadType = { $ne: 'SR' };
        expectedDirection = 'RHS';
      } else if (stream === 'SR LHS') {
        assetQuery.roadDirection = 'LHS';
        assetQuery.roadType = 'SR';
        expectedDirection = 'LHS';
        expectedRoadType = 'Service Road';
      } else if (stream === 'SR RHS') {
        assetQuery.roadDirection = 'RHS';
        assetQuery.roadType = 'SR';
        expectedDirection = 'RHS';
        expectedRoadType = 'Service Road';
      }

      const assets = await SurveyAsset.find(assetQuery).lean();
      
      // 1 & 2. Collect matching ranges and clip them to the requested start/end chainage
      const rawRanges = [];
      for (const asset of assets) {
        if (asset.coverage && asset.coverage.startChainage != null && asset.coverage.endChainage != null) {
          const s = Math.min(asset.coverage.startChainage, asset.coverage.endChainage);
          const e = Math.max(asset.coverage.startChainage, asset.coverage.endChainage);
          
          const clippedS = Math.max(s, minC);
          const clippedE = Math.min(e, maxC);
          if (clippedS <= clippedE) {
            rawRanges.push({ start: clippedS, end: clippedE, asset });
          }
        }
      }

      if (rawRanges.length === 0) {
        streamResults.push({
          name: stream,
          start: null,
          end: null,
          matchedImages: 0
        });
        continue;
      }

      // 3. Sort them
      rawRanges.sort((a, b) => a.start - b.start);
      
      // 4. Merge overlapping/continuous ranges
      const mergedRanges = [];
      let current = { start: rawRanges[0].start, end: rawRanges[0].end, assets: [rawRanges[0].asset] };

      for (let i = 1; i < rawRanges.length; i++) {
        const next = rawRanges[i];
        if (next.start <= current.end) {
          current.end = Math.max(current.end, next.end);
          current.assets.push(next.asset);
        } else {
          mergedRanges.push(current);
          current = { start: next.start, end: next.end, assets: [next.asset] };
        }
      }
      mergedRanges.push(current);

      // 5. Calculate unique covered distance and generate targets
      let streamDistance = 0;
      let streamMin = mergedRanges[0].start;
      let streamMax = mergedRanges[mergedRanges.length - 1].end;

      const roadwayChainages = new Set();
      const sourceSurveyIds = new Map(); // chainage -> asset

      for (const range of mergedRanges) {
        streamDistance += (range.end - range.start);
        
        // Target generation only inside actual covered ranges
        const firstMultiple = Math.ceil((range.start - minC) / interval) * interval + minC;
        for (let t = firstMultiple; t <= range.end; t += interval) {
          const tNum = parseFloat(t.toFixed(3));
          roadwayChainages.add(tNum);
          
          const sourceAsset = range.assets.find(a => 
            Math.min(a.coverage.startChainage, a.coverage.endChainage) <= tNum && 
            Math.max(a.coverage.startChainage, a.coverage.endChainage) >= tNum
          ) || range.assets[0];
          
          sourceSurveyIds.set(tNum, sourceAsset);
        }
      }

      // Merge with RSF targets falling within actual covered ranges
      const allTargetChainages = Array.from(new Set([...roadwayChainages, ...rsfChainagesMap.keys()]))
        .filter(c => {
          return mergedRanges.some(r => c >= r.start && c <= r.end);
        })
        .sort((a, b) => a - b);

      for (const target of allTargetChainages) {
        if (!sourceSurveyIds.has(target)) {
          const range = mergedRanges.find(r => target >= r.start && target <= r.end);
          if (range) {
            const sourceAsset = range.assets.find(a => 
              Math.min(a.coverage.startChainage, a.coverage.endChainage) <= target && 
              Math.max(a.coverage.startChainage, a.coverage.endChainage) >= target
            ) || range.assets[0];
            sourceSurveyIds.set(target, sourceAsset);
          }
        }
      }

      const uniqueMatched = allTargetChainages;

      // Check existing extraction reuse
      const chainageQueries = uniqueMatched.flatMap(c => [
        Number(c).toString(),
        Number(c).toFixed(1),
        Number(c).toFixed(2),
        Number(c).toFixed(3)
      ]);

      const existingTasks = await InspectionTask.find({
        project,
        direction: expectedDirection,
        roadType: expectedRoadType,
        chainage: { $in: chainageQueries },
        'image.cloudinaryUrl': { $exists: true, $ne: null }
      }).select('chainage image.cloudinaryUrl extractionDiagnostics').lean();

      const existingImageMap = {};
      for (const task of existingTasks) {
        const taskChainageNum = parseFloat(task.chainage);
        if (!isNaN(taskChainageNum)) {
          existingImageMap[taskChainageNum.toFixed(3)] = task.image.cloudinaryUrl;
        }
      }

      const ROADWAY_PARAMETERS_COUNT = 15;
      let streamTotalQuestions = 0;
      let streamMatchedImages = uniqueMatched.length;
      let streamExistingImages = Object.keys(existingImageMap).length;
      let streamMissingImages = streamMatchedImages - streamExistingImages;

      totalExistingImages += streamExistingImages;
      totalMissingImages += streamMissingImages;
      totalTasks += streamMatchedImages;

      streamResults.push({
        name: stream,
        start: streamMin,
        end: streamMax,
        distanceCovered: streamDistance,
        matchedImages: streamMatchedImages
      });

      for (const chainage of uniqueMatched) {
        const chainageStr = chainage.toFixed(3);
        const cNum = parseFloat(chainageStr);
        
        const isRoadway = roadwayChainages.has(cNum);
        const rsfParams = rsfChainagesMap.has(cNum) ? rsfChainagesMap.get(cNum) : [];
        const isRsf = rsfParams.length > 0;

        if (isRoadway) streamTotalQuestions += ROADWAY_PARAMETERS_COUNT;
        if (isRsf) streamTotalQuestions += rsfParams.length;

        const existingImageUrl = existingImageMap[chainageStr];
        const taskStatus = existingImageUrl ? 'READY_FOR_REVIEW' : 'PENDING_IMAGE';
        const actualAsset = sourceSurveyIds.get(cNum);

        const task = {
          project,
          category: isRoadway ? 'Roadway' : 'Road Signage and Furniture',
          chainage: chainageStr,
          assetType: 'Multi-Asset',
          assetSubType: '',
          direction: expectedDirection,
          roadType: expectedRoadType,
          imageRequirement: actualAsset ? (actualAsset.surveyType || 'DAY') : 'DAY',
          parameters: rsfParams.map(p => p._id),
          ratings: isRoadway ? [...ROADWAY_PARAMETER_CONFIG] : [],
          status: taskStatus,
          extractionDiagnostics: {
            surveyAssetId: actualAsset ? actualAsset._id.toString() : null
          }
        };

        if (existingImageUrl) {
          task.image = { cloudinaryUrl: existingImageUrl };
        }

        allTasksData.push(task);
      }

      totalQuestions += streamTotalQuestions;
    }

    return {
      streams: streamResults,
      totalQuestionInstances: totalQuestions,
      matchedImages: totalTasks,
      existingImages: totalExistingImages,
      missingExtractionImages: totalMissingImages,
      allTasksData
    };
  }

  async previewRoadwayBatch(userId, data) {
    const { project, streams, startChainage, endChainage, intervalMetres } = data;
    if (!project || !streams || streams.length === 0 || startChainage == null || endChainage == null || !intervalMetres) {
      throw new Error('Missing required fields for Roadway preview');
    }
    
    const processed = await this._processStreams(project, streams, startChainage, endChainage, intervalMetres);
    
    return {
      streams: processed.streams,
      matchedImages: processed.matchedImages,
      existingImages: processed.existingImages,
      missingExtractionImages: processed.missingExtractionImages,
      startChainage: Math.min(startChainage, endChainage),
      endChainage: Math.max(startChainage, endChainage),
      intervalMetres,
      questionsPerImage: 15,
      totalQuestionInstances: processed.totalQuestionInstances
    };
  }

  async createRoadwayBatch(userId, data) {
    const { project, streams, startChainage, endChainage, intervalMetres } = data;
    if (!project || !streams || streams.length === 0 || startChainage == null || endChainage == null || !intervalMetres) {
      throw new Error('Missing required fields for Roadway batch creation');
    }
    
    const processed = await this._processStreams(project, streams, startChainage, endChainage, intervalMetres);
    
    const ROADWAY_PARAMETERS_COUNT = 15;
    const name = `Roadway-RSF-${project}-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)}`;

    const newBatchData = {
      name,
      project,
      categories: [],
      assetTypes: ['Multi-Asset'],
      samplingPercentage: 100,
      samplingStrategy: 'CONTINUOUS',
      totalMasterQuestions: ROADWAY_PARAMETERS_COUNT,
      selectedQuestionsCount: processed.totalQuestionInstances,
      uniqueChainagesCount: processed.matchedImages,
      status: 'WAITING_FOR_IMAGES',
      createdBy: userId,
      isSamplingHistoryReset: false
    };

    const Batch = require('../../../models/InspectionBatch.model');
    const InspectionTask = require('../../../models/InspectionTask.model');

    const createdBatch = await Batch.create(newBatchData);

    const tasksToInsert = processed.allTasksData.map(task => ({
      ...task,
      batchId: createdBatch._id
    }));

    if (tasksToInsert.length > 0) {
      await InspectionTask.insertMany(tasksToInsert);
    }

    if (processed.missingExtractionImages === 0) {
      createdBatch.status = 'READY_FOR_RATING';
      await createdBatch.save();
    }

    return createdBatch;
  }

  async listBatches(filters) {
    return inspectionEngineRepository.listBatches(filters);
  }

  async getBatchDetails(batchId) {
    const batchDetails = await inspectionEngineRepository.getBatchDetails(batchId);
    if (!batchDetails) throw new Error('Batch not found');
    return batchDetails;
  }

  async deleteBatch(batchId) {
    return inspectionEngineRepository.deleteBatch(batchId);
  }

  async getExtractionReport(batchId) {
    return inspectionEngineRepository.getExtractionReport(batchId);
  }
}

module.exports = new InspectionEngineService();
