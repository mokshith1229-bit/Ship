'use strict';

const xlsx = require('xlsx');
const InspectionBatch = require('../../../models/InspectionBatch.model');
const InspectionTask = require('../../../models/InspectionTask.model');
const mongoose = require('mongoose');

const STRUCTURE_QUESTION_DEFINITIONS = {
  // Rigid Crash Barriers
  'RCB_HAND_RAIL': { code: 'RCB_HAND_RAIL', question: 'Hand rail pipe – missing / rusted / damaged', category: 'Rigid Crash Barriers', placement: 'ALL_POINTS' },
  'RCB_PAINTING': { code: 'RCB_PAINTING', question: 'Painting of RC crash barrier inner face – faded / not faded', category: 'Rigid Crash Barriers', placement: 'ALL_POINTS' },
  'RCB_CRACKS': { code: 'RCB_CRACKS', question: 'Cracks', category: 'Rigid Crash Barriers', placement: 'ALL_POINTS' },
  'RCB_CHIPPED': { code: 'RCB_CHIPPED', question: 'Chipped concrete due to accidents', category: 'Rigid Crash Barriers', placement: 'ALL_POINTS' },

  // Wearing coat on deck slab
  'WC_POTHOLES': { code: 'WC_POTHOLES', question: 'Potholes', category: 'Wearing coat on deck slab', placement: 'ALL_POINTS' },
  'WC_CRACKS': { code: 'WC_CRACKS', question: 'Cracks (Alligator cracks)', category: 'Wearing coat on deck slab', placement: 'ALL_POINTS' },
  'WC_RUTTING': { code: 'WC_RUTTING', question: 'Rutting', category: 'Wearing coat on deck slab', placement: 'ALL_POINTS' },

  // Other Structure Questions
  'NON_BURIED_EXPANSION_JOINT': { code: 'NON_BURIED_EXPANSION_JOINT', question: 'Non buried expansion joint', category: 'Structures', placement: 'ALL_POINTS' },
  'DRAINAGE_SPOUTS': { code: 'DRAINAGE_SPOUTS', question: 'Drainage spouts', category: 'Structures', placement: 'ALL_POINTS' },
  'APPROACH_SETTLEMENTS': { code: 'APPROACH_SETTLEMENTS', question: 'Approach settlements', category: 'Structures', placement: 'START_END' },
  'STAGNATION_OF_RAIN_WATER': { code: 'STAGNATION_OF_RAIN_WATER', question: 'Stagnation of rain water', category: 'Structures', placement: 'ALL_POINTS' },
  'STRUCTURE_NUMBERING': { code: 'STRUCTURE_NUMBERING', question: 'Structure Numbering', category: 'Structures', placement: 'START' },
  'OBJECT_HAZARD_MARKER': { code: 'OBJECT_HAZARD_MARKER', question: 'Object hazard marker', category: 'Structures', placement: 'START' }
};

const STRUCTURE_QUESTION_CONFIG = {
  'BC': [
    STRUCTURE_QUESTION_DEFINITIONS['WC_POTHOLES'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_RUTTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_HAND_RAIL'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_PAINTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CHIPPED'],
    STRUCTURE_QUESTION_DEFINITIONS['APPROACH_SETTLEMENTS'],
    STRUCTURE_QUESTION_DEFINITIONS['STAGNATION_OF_RAIN_WATER'],
    STRUCTURE_QUESTION_DEFINITIONS['STRUCTURE_NUMBERING'],
    STRUCTURE_QUESTION_DEFINITIONS['OBJECT_HAZARD_MARKER']
  ],
  'PIPE_CULVERT': [
    STRUCTURE_QUESTION_DEFINITIONS['WC_POTHOLES'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_RUTTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_HAND_RAIL'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_PAINTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CHIPPED'],
    STRUCTURE_QUESTION_DEFINITIONS['APPROACH_SETTLEMENTS'],
    STRUCTURE_QUESTION_DEFINITIONS['STAGNATION_OF_RAIN_WATER'],
    STRUCTURE_QUESTION_DEFINITIONS['STRUCTURE_NUMBERING'],
    STRUCTURE_QUESTION_DEFINITIONS['OBJECT_HAZARD_MARKER']
  ],
  'VUP_LVUP_PUP': [
    STRUCTURE_QUESTION_DEFINITIONS['WC_POTHOLES'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_RUTTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_HAND_RAIL'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_PAINTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CHIPPED'],
    STRUCTURE_QUESTION_DEFINITIONS['APPROACH_SETTLEMENTS'],
    STRUCTURE_QUESTION_DEFINITIONS['STAGNATION_OF_RAIN_WATER'],
    STRUCTURE_QUESTION_DEFINITIONS['STRUCTURE_NUMBERING'],
    STRUCTURE_QUESTION_DEFINITIONS['OBJECT_HAZARD_MARKER']
  ],
  'MNB': [
    STRUCTURE_QUESTION_DEFINITIONS['WC_POTHOLES'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_RUTTING'],
    STRUCTURE_QUESTION_DEFINITIONS['DRAINAGE_SPOUTS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_HAND_RAIL'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_PAINTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CHIPPED'],
    STRUCTURE_QUESTION_DEFINITIONS['APPROACH_SETTLEMENTS'],
    STRUCTURE_QUESTION_DEFINITIONS['STAGNATION_OF_RAIN_WATER'],
    STRUCTURE_QUESTION_DEFINITIONS['STRUCTURE_NUMBERING'],
    STRUCTURE_QUESTION_DEFINITIONS['OBJECT_HAZARD_MARKER']
  ],
  'MJB': [
    STRUCTURE_QUESTION_DEFINITIONS['WC_POTHOLES'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['WC_RUTTING'],
    STRUCTURE_QUESTION_DEFINITIONS['NON_BURIED_EXPANSION_JOINT'],
    STRUCTURE_QUESTION_DEFINITIONS['DRAINAGE_SPOUTS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_HAND_RAIL'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_PAINTING'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CRACKS'],
    STRUCTURE_QUESTION_DEFINITIONS['RCB_CHIPPED'],
    STRUCTURE_QUESTION_DEFINITIONS['APPROACH_SETTLEMENTS'],
    STRUCTURE_QUESTION_DEFINITIONS['STAGNATION_OF_RAIN_WATER'],
    STRUCTURE_QUESTION_DEFINITIONS['STRUCTURE_NUMBERING'],
    STRUCTURE_QUESTION_DEFINITIONS['OBJECT_HAZARD_MARKER']
  ]
};

const normalizeStructureType = (type) => {
  const lower = String(type).toLowerCase();
  if (lower.includes('major bridge')) return 'MJB';
  if (lower.includes('minor bridge')) return 'MNB';
  if (lower.includes('box culvert')) return 'BC';
  if (lower.includes('pipe culvert')) return 'PIPE_CULVERT';
  if (lower.includes('pup') || lower.includes('vup') || lower.includes('lvup') || lower.includes('underpass')) return 'VUP_LVUP_PUP';
  return null;
};

class StructureEngineService {
  
  async detectSheets(fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const structureSheetNames = [];
    const knownTypesMap = {
      'major bridge': 'Major Bridge',
      'minor bridge': 'Minor Bridge',
      'box culvert': 'Box Culvert',
      'pipe culvert': 'Pipe Culvert',
      'lvup': 'LVUP',
      'vup': 'VUP',
      'pup': 'PUP',
      'underpass': 'Underpass'
    };
    
    workbook.SheetNames.forEach(sheetName => {
      const lower = sheetName.toLowerCase();
      
      let detectedType = null;
      for (const type of Object.keys(knownTypesMap)) {
        if (lower.includes(type)) {
          detectedType = knownTypesMap[type];
          break;
        }
      }
      
      if (!detectedType) {
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const flatData = rawData.flat().map(c => String(c).toLowerCase());
        for (const type of Object.keys(knownTypesMap)) {
          if (flatData.some(cell => cell.includes(type))) {
            detectedType = knownTypesMap[type];
            break;
          }
        }
      }
      
      if (detectedType) {
        structureSheetNames.push({
          sheetName,
          type: detectedType
        });
      }
    });
    return structureSheetNames;
  }

  _findHeaderRowAndData(sheet) {
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }); 
    const expectedKeywords = ['sl', 'km', 'chainage', 'side', 'length', 'span', 'width', 'structure', 'type', 'remarks', 'from', 'to', 'end'];
    
    let bestRowIndex = 0;
    let maxMatches = 0;
    
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
        bestRowIndex = i;
      }
    }
    
    const headers = rawData[bestRowIndex];
    const dataRows = [];
    
    for (let i = bestRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every(cell => cell === '')) continue;
      
      const rowObj = {};
      let hasData = false;
      headers.forEach((header, colIndex) => {
        if (header && String(header).trim() !== '') {
          // Normalize header: remove periods, replace whitespace/newlines/hyphens with underscore, remove parentheses
          let cleanHeader = String(header).trim().toLowerCase();
          cleanHeader = cleanHeader.replace(/\./g, '');
          cleanHeader = cleanHeader.replace(/[\(\)]/g, ''); // remove parentheses like (m)
          cleanHeader = cleanHeader.replace(/[\s\n\r\-]+/g, '_'); // replace spaces/hyphens with underscore
          
          rowObj[cleanHeader] = row[colIndex] !== undefined ? row[colIndex] : '';
          if (row[colIndex] !== '') hasData = true;
        }
      });
      if (hasData) {
        // keep track of original row number for errors
        rowObj._originalRow = i + 1;
        dataRows.push(rowObj);
      }
    }
    
    return dataRows;
  }

  async parseStructureExcel(fileBuffer, interval = 20, selectedSheets = [], minChainage = null, maxChainage = null, structureTypeFilter = 'All Structures') {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const validStructures = [];
    const invalidStructures = [];
    let totalInspectionPoints = 0;
    let totalQuestionsGenerated = 0;

    for (const sheetInfo of selectedSheets) {
      const sheetName = sheetInfo.sheetName;
      const structType = sheetInfo.type;
      
      if (!workbook.Sheets[sheetName]) continue;
      
      const parsedData = this._findHeaderRowAndData(workbook.Sheets[sheetName]);
      
      let parentValues = {}; 
      let groupedStructures = new Map(); 
      
      parsedData.forEach((normalizedRow) => {
        let slNo = normalizedRow['sl_no'] || normalizedRow['sl_no.'] || normalizedRow['sl._no.'] || normalizedRow['sl.no.'];
        if (slNo !== '' && slNo !== undefined) {
          parentValues.slNo = slNo;
        } else {
          slNo = parentValues.slNo;
        }

        let existingKmStr = normalizedRow['existing_km'] || normalizedRow['chainage'] || normalizedRow['existing_chainage'] || normalizedRow['start_chainage'] || normalizedRow['from'];
        if (existingKmStr !== '' && existingKmStr !== undefined) {
          parentValues.existingKm = existingKmStr;
        } else {
          existingKmStr = parentValues.existingKm;
        }

        let spanArrangement = normalizedRow['span_arrangement'] || normalizedRow['span_arrangement_m'];
        if (spanArrangement !== '' && spanArrangement !== undefined) {
          parentValues.spanArrangement = spanArrangement;
        } else {
          spanArrangement = parentValues.spanArrangement;
        }

        let lengthStr = normalizedRow['length_of_structure_m'] || normalizedRow['length_of_structure'] || normalizedRow['structure_length'] || normalizedRow['length_m'] || normalizedRow['length'];
        if (lengthStr !== '' && lengthStr !== undefined) {
          parentValues.lengthStr = lengthStr;
        } else {
          lengthStr = parentValues.lengthStr;
        }
        
        let side = normalizedRow['side'];
        if (!side) side = 'BHS';
        side = String(side).toUpperCase().trim();

        if (existingKmStr === undefined || existingKmStr === '') {
          // If we still don't have an existingKm after carrying forward, it might be a genuinely invalid row, but we don't reject the workbook.
          return;
        }

        const startChainage = parseFloat(existingKmStr);
        if (isNaN(startChainage)) {
          return;
        }

        const isRange = structType.toLowerCase().includes('major bridge') || structType.toLowerCase().includes('minor bridge');
        let length = parseFloat(lengthStr);
        let explicitEndChainage = null;

        let endKmStr = normalizedRow['to'] || normalizedRow['end_ch'] || normalizedRow['end_chainage'] || normalizedRow['end'];
        if (endKmStr !== undefined && endKmStr !== '') {
          const parsedEnd = parseFloat(endKmStr);
          if (!isNaN(parsedEnd)) {
            explicitEndChainage = parsedEnd;
          }
        }
        
        // Fallback: Calculate length if explicit end chainage is provided but length is missing/invalid
        if ((isNaN(length) || length <= 0) && explicitEndChainage !== null) {
          length = parseFloat((explicitEndChainage - startChainage).toFixed(3));
        }
        
        if (isRange) {
          if (isNaN(length) || length <= 0) {
            // Wait to mark invalid until we assemble the whole structure group
          }
        } else {
          length = null; 
        }

        const groupKey = `${slNo || 'NA'}_${startChainage}`;

        if (!groupedStructures.has(groupKey)) {
          groupedStructures.set(groupKey, {
            structureId: slNo ? String(slNo) : `Struct-${startChainage}`,
            type: structType,
            sheet: sheetName,
            startChainage,
            explicitEndChainage,
            length,
            sides: new Set(),
            spanArrangement,
            carriagewayWidth: normalizedRow['carriageway_width'],
            footpath: normalizedRow['footpath'],
            crashBarrier: normalizedRow['crash_barrier'],
            totalWidth: normalizedRow['total_width'],
            deckWidth: normalizedRow['deck_width'],
            typeOfSubstructure: normalizedRow['type_of_substructure'] || normalizedRow['substructure_type'] || normalizedRow['type_of_sub_structure'],
            typeOfSuperstructure: normalizedRow['type_of_superstructure'] || normalizedRow['superstructure_type'] || normalizedRow['type_of_super_structure'],
            typeOfCulvert: normalizedRow['type_of_culvert'] || structType,
            remarks: normalizedRow['remarks'],
            _originalRow: normalizedRow._originalRow
          });
        }
        
        const structObj = groupedStructures.get(groupKey);
        structObj.sides.add(side);
        // Sometimes span/length is only on the second row (e.g. RHS row)
        if (length && !structObj.length) structObj.length = length;
        if (spanArrangement && !structObj.spanArrangement) structObj.spanArrangement = spanArrangement;
      });

      for (const [key, structObj] of groupedStructures.entries()) {
        const isRange = structObj.type.toLowerCase().includes('major bridge') || structObj.type.toLowerCase().includes('minor bridge');
        
        if (isRange && (structObj.length === null || structObj.length === undefined || isNaN(structObj.length) || structObj.length <= 0)) {
          invalidStructures.push({ rowNumber: structObj._originalRow || 'Multiple', sheet: sheetName, reason: `Missing or invalid length for range structure (Start: ${structObj.startChainage})` });
          continue;
        }

        const sidesArray = Array.from(structObj.sides);
        let finalSide = sidesArray.join(' + ');
        if (sidesArray.includes('BHS') || (sidesArray.includes('LHS') && sidesArray.includes('RHS'))) {
          finalSide = 'BHS';
        }

        let endChainage = null;
        if (isRange) {
          if (structObj.explicitEndChainage !== null) {
            endChainage = structObj.explicitEndChainage;
          } else if (structObj.length && !isNaN(structObj.length)) {
            // Assume length < 50 is in KM, otherwise it's in meters
            const lengthKm = structObj.length < 50 ? structObj.length : (structObj.length / 1000);
            endChainage = structObj.startChainage + lengthKm;
          } else {
            endChainage = structObj.startChainage; // Fallback to start if no length provided
          }
        }

        // Apply Optional Structure Type Filter
        if (structureTypeFilter && structureTypeFilter !== 'All Structures') {
          if (structureTypeFilter.toLowerCase() !== structObj.type.toLowerCase()) {
            continue; // Skip this structure as it doesn't match the type filter
          }
        }

        // Apply Optional Chainage Range Filter to the entire structure
        if (minChainage !== null && maxChainage !== null) {
          const sStart = structObj.startChainage;
          const sEnd = endChainage !== null ? endChainage : structObj.startChainage;
          // Intersection check
          if (!(sEnd >= minChainage && sStart <= maxChainage)) {
            continue; // Completely outside the range
          }
        }

        let chainages = [];
        if (isRange) {
          chainages = this._generateChainages(structObj.startChainage, endChainage, interval);
        } else {
          chainages = [Number(structObj.startChainage.toFixed(3))];
        }

        // Filter actual points based on the range filter
        if (minChainage !== null && maxChainage !== null) {
          chainages = chainages.filter(c => c >= minChainage && c <= maxChainage);
        }

        if (chainages.length === 0) {
          continue; // No points left to inspect
        }

        // Question Resolution Logic
        const normalizedType = normalizeStructureType(structObj.type);
        const questions = normalizedType ? STRUCTURE_QUESTION_CONFIG[normalizedType] : null;

        if (!questions) {
          throw new Error(`No Structure Question Configuration found for ${structObj.type}`);
        }
        
        // Generate points with location-specific questions
        const generatedPoints = [];
        let questionsCountForStructure = 0;

        for (const pointChainage of chainages) {
          const pointQuestions = [];
          
          const isStart = Number(pointChainage.toFixed(3)) === Number(structObj.startChainage.toFixed(3));
          const isEnd = endChainage !== null && Number(pointChainage.toFixed(3)) === Number(endChainage.toFixed(3));

          for (const config of questions) {
            let include = true;
            if (config.placement === 'START_END' && !isStart && !isEnd) include = false;
            if (config.placement === 'START' && !isStart) include = false;

            if (include) {
              pointQuestions.push(config);
            }
          }

          generatedPoints.push({
            chainage: pointChainage,
            parameters: pointQuestions
          });
          
          questionsCountForStructure += pointQuestions.length;
          totalQuestionsGenerated += pointQuestions.length;
        }

        console.log(`\nSTRUCTURE QUESTION DEBUG`);
        console.log(`Structure ID: ${structObj.structureId}`);
        console.log(`Original Type: ${structObj.type}`);
        console.log(`Normalized Type: ${normalizedType}`);
        console.log(`Config Found: ${questions ? 'YES' : 'NO'}`);
        console.log(`Configured Questions: ${questions ? questions.length : 0}`);
        console.log(`Inspection Points: ${chainages.length}`);
        console.log(`Assigned Questions: ${questionsCountForStructure}\n`);

        validStructures.push({
          ...structObj,
          side: finalSide,
          endChainage,
          generatedChainages: generatedPoints,
          normalizedType,
          questionsMatrix: {
            applicable: questions ? questions.length : 0,
            totalGenerated: questionsCountForStructure
          },
          sides: undefined, 
          _originalRow: undefined
        });
        
        totalInspectionPoints += generatedPoints.length;
      }
    }

    return {
      totalStructuresFound: validStructures.length + invalidStructures.length,
      validStructuresCount: validStructures.length,
      invalidStructuresCount: invalidStructures.length,
      totalInspectionPoints,
      totalQuestionsGenerated,
      validStructures,
      invalidStructures
    };
  }

  _generateChainages(start, end, intervalMeters) {
    const chainages = new Set();
    const intervalKm = intervalMeters / 1000;
    
    chainages.add(Number(start.toFixed(3)));
    
    let current = start + intervalKm;
    while (current < end) {
      chainages.add(Number(current.toFixed(3)));
      current += intervalKm;
    }
    
    chainages.add(Number(end.toFixed(3)));
    
    return Array.from(chainages).sort((a, b) => a - b);
  }

  async generateBatch(userId, projectId, structures, batchName) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const batch = new InspectionBatch({
        name: batchName || `Structure Batch - ${new Date().toISOString()}`,
        project: projectId,
        samplingStrategy: 'CONTINUOUS',
        samplingPercentage: 100,
        status: 'WAITING_FOR_IMAGES',
        createdBy: userId
      });
      await batch.save({ session });

      const tasksToInsert = [];

      for (const struct of structures) {
        for (const point of struct.generatedChainages) {
          const chainageStr = typeof point === 'object' ? point.chainage.toFixed(3) : point.toFixed(3);
          const rawParameters = typeof point === 'object' ? point.parameters : [];
          
          // Map to Mongoose Ratings Schema instead of Parameters to avoid ObjectId casting failure
          const mappedRatings = rawParameters.map(q => ({
            parameterKey: q.code,
            parameterName: q.question,
            group: q.category || 'Structures',
            score: 10
          }));

          const sidesToGenerate = struct.side === 'BHS' ? ['LHS', 'RHS'] : [struct.side];

          for (const dir of sidesToGenerate) {
            tasksToInsert.push({
              batchId: batch._id,
              project: projectId,
              category: 'Structures',
              direction: dir,
              assetType: struct.type, 
              assetSubType: struct.typeOfSuperstructure,
              chainage: chainageStr,
              status: 'PENDING_IMAGE',
              parameters: [], // Must be empty to satisfy ObjectId ref validation
              ratings: mappedRatings,
              assetMetadata: {
              structureId: struct.structureId,
              typeOfStructure: struct.type,
              sourceSheet: struct.sheet,
              startChainage: struct.startChainage,
              endChainage: struct.endChainage,
              length: struct.length,
              side: struct.side,
              spanArrangement: struct.spanArrangement,
              carriagewayWidth: struct.carriagewayWidth,
              footpath: struct.footpath,
              crashBarrier: struct.crashBarrier,
              totalWidth: struct.totalWidth,
              deckWidth: struct.deckWidth,
              typeOfSubstructure: struct.typeOfSubstructure,
              typeOfSuperstructure: struct.typeOfSuperstructure,
              typeOfCulvert: struct.typeOfCulvert,
              remarks: struct.remarks
            }
          });
          }
        }
      }

      // Deduplicate tasks based on structureId + chainage
      const uniqueTasksMap = new Map();
      let selectedQuestionsCount = 0;
      const uniqueChainages = new Set();
      const assetTypes = new Set();

      for (const task of tasksToInsert) {
        const key = `${task.assetMetadata.structureId}-${task.chainage}`;
        if (!uniqueTasksMap.has(key)) {
          uniqueTasksMap.set(key, task);
          selectedQuestionsCount += task.ratings.length;
          uniqueChainages.add(task.chainage);
          assetTypes.add(task.assetType);
        }
      }

      const finalTasks = Array.from(uniqueTasksMap.values());
      await InspectionTask.insertMany(finalTasks, { session });
      
      batch.categories = ['Structures'];
      batch.assetTypes = Array.from(assetTypes);
      batch.selectedQuestionsCount = selectedQuestionsCount;
      batch.totalMasterQuestions = selectedQuestionsCount; // 100% sampling means master and sampled are equal
      batch.uniqueChainagesCount = uniqueChainages.size;

      await batch.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        batchId: batch._id,
        tasksCreated: finalTasks.length
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new StructureEngineService();
