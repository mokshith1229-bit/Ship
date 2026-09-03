'use strict';

const xlsx = require('xlsx');
const mongoose = require('mongoose');
const InspectionBatch = require('../../../models/InspectionBatch.model');
const InspectionTask = require('../../../models/InspectionTask.model');
const { PROJECT_FACILITY_QUESTION_CONFIG } = require('../projectFacilities.config');

const normalizeFacilityType = (type) => {
  if (!type) return null;
  const lower = String(type).trim().toLowerCase();
  if (lower.includes('bus bay') || lower.includes('busbay')) return 'BUS_BAY';
  if (lower.includes('truck lay by') || lower.includes('truck lay-by') || lower.includes('truck layby') || lower.includes('trucklaybye') || lower.includes('truck laybye')) return 'TRUCK_LAY_BY';
  return null;
};

class ProjectFacilitiesService {
  
  async parseFacilityExcel(fileBuffer, projectId) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const validFacilities = [];
    const invalidFacilities = [];
    
    // We only process the first sheet, or all sheets. Let's process all sheets for facilities.
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      
      // Find header row
      let headerRowIndex = 0;
      let maxMatches = 0;
      const expectedKeywords = ['chainage', 'facility', 'type', 'km', 'asset'];
      
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
      let currentFacilityName = null;
      let currentSide = 'N/A';

      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.every(cell => cell === '')) continue;
        
        let facilityTypeRaw = null;
        let chainageRaw = null;
        let sideRaw = null;
        
        headers.forEach((header, colIndex) => {
          if (!header) return;
          const cleanHeader = String(header).trim().toLowerCase();
          
          if (cleanHeader.includes('facility') || cleanHeader.includes('type') || cleanHeader.includes('asset')) {
            facilityTypeRaw = row[colIndex] !== '' ? row[colIndex] : null;
          }
          if (cleanHeader.includes('chainage') || cleanHeader.includes('km')) {
            chainageRaw = row[colIndex] !== '' ? row[colIndex] : null;
          }
          if (cleanHeader.includes('side') || cleanHeader.includes('direction')) {
            sideRaw = row[colIndex] !== '' ? row[colIndex] : null;
          }
        });
        
        // Handle merged cells
        if (facilityTypeRaw) {
          currentFacilityName = String(facilityTypeRaw).trim();
        } else {
          facilityTypeRaw = currentFacilityName;
        }

        if (sideRaw) {
          currentSide = String(sideRaw).trim().toUpperCase();
        } else {
          sideRaw = currentSide;
        }

        const originalRowStr = `Sheet: ${sheetName}, Row: ${i + 1}`;
        
        // Validate Facility Type
        const normalizedType = normalizeFacilityType(facilityTypeRaw);
        if (!normalizedType) {
          invalidFacilities.push({
            row: originalRowStr,
            facilityRaw: facilityTypeRaw,
            chainageRaw,
            reason: facilityTypeRaw ? 'Unsupported Facility Type' : 'Missing Facility Type'
          });
          continue;
        }
        
        // Validate Chainage
        const chainageNum = parseFloat(chainageRaw);
        if (isNaN(chainageNum)) {
          invalidFacilities.push({
            row: originalRowStr,
            facilityRaw: facilityTypeRaw,
            chainageRaw,
            reason: 'Invalid or missing Chainage'
          });
          continue;
        }

        // Get hardcoded questions
        const questions = PROJECT_FACILITY_QUESTION_CONFIG[normalizedType];
        if (!questions || questions.length === 0) {
          invalidFacilities.push({
            row: originalRowStr,
            facilityRaw: facilityTypeRaw,
            chainageRaw,
            reason: `No code-defined questions for ${normalizedType}`
          });
          continue;
        }

          const sideVal = sideRaw === 'RHS' || sideRaw === 'LHS' ? sideRaw : 'N/A';
        validFacilities.push({
          id: `${normalizedType}-${chainageNum.toFixed(3)}-${sideVal}`, // Unique ID for duplicate detection
          originalType: facilityTypeRaw,
          normalizedType,
          chainage: chainageNum,
          side: sideVal,
          questionsMatrix: {
            applicable: questions.length,
            totalGenerated: questions.length
          },
          questionsConfig: questions,
          _originalRow: originalRowStr
        });
      }
    });

    // Handle Duplicates
    const uniqueValid = [];
    const seenMap = new Map();

    for (const f of validFacilities) {
      if (seenMap.has(f.id)) {
        invalidFacilities.push({
          row: f._originalRow,
          facilityRaw: f.originalType,
          chainageRaw: f.chainage,
          reason: 'Duplicate Facility Type + Chainage'
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
      validFacilities: uniqueValid,
      invalidFacilities,
      summary: {
        facilitiesFound: uniqueValid.length,
        totalQuestionsGenerated: totalQuestions,
        invalidSkipped: invalidFacilities.length
      }
    };
  }

  async generateBatch(userId, projectId, facilities, batchName) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const batch = new InspectionBatch({
        name: batchName || `Project Facilities - ${new Date().toISOString()}`,
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

      for (const facility of facilities) {
        const chainageStr = facility.chainage.toFixed(3);
        const mappedRatings = facility.questionsConfig.map(q => ({
          parameterKey: q.code,
          parameterName: q.question,
          group: q.category || 'Project Facilities',
          score: 10
        }));

        tasksToInsert.push({
          batchId: batch._id,
          project: projectId,
          category: 'Project Facilities',
          direction: facility.side,
          assetType: facility.normalizedType === 'BUS_BAY' ? 'Bus Bay' : 'Truck Lay By',
          chainage: chainageStr,
          status: 'PENDING_IMAGE',
          parameters: [], // Must be empty to satisfy ObjectId ref validation
          ratings: mappedRatings,
          assetMetadata: {
            typeOfFacility: facility.originalType,
            chainage: facility.chainage,
            side: facility.side
          }
        });

        selectedQuestionsCount += mappedRatings.length;
        uniqueChainages.add(chainageStr);
        assetTypes.add(facility.normalizedType === 'BUS_BAY' ? 'Bus Bay' : 'Truck Lay By');
      }

      await InspectionTask.insertMany(tasksToInsert, { session });
      
      batch.categories = ['Project Facilities'];
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

module.exports = new ProjectFacilitiesService();
