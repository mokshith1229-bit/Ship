'use strict';

const xlsx = require('xlsx');
const mongoose = require('mongoose');
const InspectionBatch = require('../../../models/InspectionBatch.model');
const InspectionTask = require('../../../models/InspectionTask.model');
const { ATMS_QUESTION_CONFIG } = require('../atms.config');

const normalizeAtmsType = (type) => {
  if (!type) return null;
  const lower = String(type).trim().toLowerCase();
  
  if (lower.includes('cctv')) return 'CCTV';
  if (lower.includes('vms')) return 'VMS';
  if (lower.includes('traffic signal') || lower.includes('signal')) return 'TRAFFIC_SIGNAL';
  if (lower.includes('vehicle detection') || lower.includes('traffic sensor')) return 'TRAFFIC_SENSOR';
  if (lower.includes('weather') || lower.includes('wms')) return 'WEATHER_STATION';
  if (lower.includes('atc') || lower.includes('traffic counter')) return 'ATC';
  if (lower.includes('anpr') || lower.includes('enforcement')) return 'ANPR';
  if (lower.includes('emergency call') || lower.includes('sos')) return 'SOS';
  
  return 'OTHER';
};

class AtmsService {
  async parseAtmsExcel(fileBuffer, projectId) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const validAssets = [];
    const invalidAssets = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      
      let headerRowIndex = 0;
      let maxMatches = 0;
      const expectedKeywords = ['chainage', 'km', 'location', 's. no.', 's.no'];
      
      for (let i = 0; i < Math.min(20, rawData.length); i++) {
        const row = rawData[i];
        if (!row) continue;
        const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
        let matches = 0;
        for (const kw of expectedKeywords) {
          if (rowStr.includes(kw)) matches++;
        }
        if (matches > maxMatches) {
          maxMatches = matches;
          headerRowIndex = i;
        }
      }
      
      const headers = rawData[headerRowIndex] || [];
      let currentSide = 'N/A';
      
      const assetTypeRaw = sheetName.trim();
      const normalizedType = normalizeAtmsType(assetTypeRaw);

      if (!normalizedType) {
        // If the sheet name doesn't match a known ATMS type, we skip the entire sheet quietly
        return;
      }

      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.every(cell => cell === '')) continue;
        
        let chainageRaw = null;
        let sideRaw = null;
        let locationRaw = null;
        
        headers.forEach((header, colIndex) => {
          if (!header) return;
          const cleanHeader = String(header).trim().toLowerCase();
          
          if (cleanHeader.includes('chainage') || cleanHeader.includes('km')) {
            chainageRaw = row[colIndex] !== '' ? row[colIndex] : null;
          }
          if (cleanHeader.includes('side') || cleanHeader.includes('direction')) {
            sideRaw = row[colIndex] !== '' ? row[colIndex] : null;
          }
          if (cleanHeader.includes('location')) {
            locationRaw = row[colIndex] !== '' ? row[colIndex] : null;
          }
        });

        if (sideRaw) {
          currentSide = String(sideRaw).trim().toUpperCase();
        } else {
          sideRaw = currentSide;
        }

        const originalRowStr = `Sheet: ${sheetName}, Row: ${i + 1}`;
        
        const chainageNum = parseFloat(chainageRaw);
        if (isNaN(chainageNum)) {
          invalidAssets.push({
            row: originalRowStr,
            assetRaw: assetTypeRaw,
            chainageRaw,
            reason: 'Invalid or missing Chainage'
          });
          continue;
        }

        const questions = ATMS_QUESTION_CONFIG[normalizedType] || [];
        if (questions.length === 0) {
          invalidAssets.push({
            row: originalRowStr,
            assetRaw: assetTypeRaw,
            chainageRaw,
            reason: `Questions not configured for this ATMS asset type.`
          });
          continue;
        }

        validAssets.push({
          id: `${normalizedType}-${chainageNum.toFixed(3)}-${sideRaw}-${locationRaw || 'NA'}`,
          originalType: assetTypeRaw,
          normalizedType,
          chainage: chainageNum,
          side: sideRaw === 'RHS' || sideRaw === 'LHS' || sideRaw === 'BHS' ? sideRaw : 'N/A',
          location: locationRaw || '',
          questionsMatrix: {
            applicable: questions.length,
            totalGenerated: questions.length
          },
          questionsConfig: questions,
          _originalRow: originalRowStr
        });
      }
    });

    const uniqueValid = [];
    const seenMap = new Map();

    for (const f of validAssets) {
      if (seenMap.has(f.id)) {
        invalidAssets.push({
          row: f._originalRow,
          assetRaw: f.originalType,
          chainageRaw: f.chainage,
          reason: 'Duplicate ATMS Type + Chainage + Side + Location'
        });
      } else {
        seenMap.set(f.id, true);
        uniqueValid.push(f);
      }
    }

    let totalQuestions = 0;
    uniqueValid.forEach(f => {
      totalQuestions += f.questionsMatrix.totalGenerated;
    });

    return {
      validAssets: uniqueValid,
      invalidAssets,
      summary: {
        assetsFound: uniqueValid.length,
        totalQuestionsGenerated: totalQuestions,
        invalidSkipped: invalidAssets.length
      }
    };
  }

  async generateBatch(userId, projectId, assets, batchName) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const batch = new InspectionBatch({
        name: batchName || `ATMS - ${new Date().toISOString()}`,
        project: projectId,
        samplingStrategy: 'CONTINUOUS',
        samplingPercentage: 100,
        status: 'WAITING_FOR_IMAGES',
        createdBy: userId
      });
      await batch.save({ session });

      const tasksToInsert = [];
      let selectedQuestionsCount = 0;
      const uniqueChainages = new Set();
      const assetTypes = new Set();

      for (const asset of assets) {
        const chainageStr = asset.chainage.toFixed(3);
        const mappedRatings = asset.questionsConfig.map(q => ({
          parameterKey: q.code,
          parameterName: q.question,
          group: q.category || 'ATMS',
          score: 10
        }));

        tasksToInsert.push({
          batchId: batch._id,
          project: projectId,
          category: 'ATMS',
          direction: asset.side,
          assetType: asset.originalType,
          assetSubType: asset.location || '',
          chainage: chainageStr,
          status: 'PENDING_IMAGE',
          parameters: [],
          ratings: mappedRatings,
          assetMetadata: {
            typeOfFacility: asset.originalType,
            chainage: asset.chainage,
            side: asset.side
          }
        });

        selectedQuestionsCount += mappedRatings.length;
        uniqueChainages.add(chainageStr);
        assetTypes.add(asset.normalizedType === 'CCTV' ? 'CCTV' : asset.originalType || asset.normalizedType);
      }

      await InspectionTask.insertMany(tasksToInsert, { session });
      
      batch.categories = ['ATMS'];
      batch.assetTypes = Array.from(assetTypes);
      batch.selectedQuestionsCount = selectedQuestionsCount;
      batch.totalMasterQuestions = selectedQuestionsCount;
      batch.uniqueChainagesCount = uniqueChainages.size;

      await batch.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        batchId: batch._id,
        tasksCreated: tasksToInsert.length,
        questionsAssigned: selectedQuestionsCount
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new AtmsService();
