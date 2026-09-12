'use strict';

const ExcelJS = require('exceljs');
const { drawDonutChart, drawHorizontalBarChart, drawParetoChart, drawScatterPlot, drawSimpleLegend, drawSectionBox, drawClusteredColumnChart, drawLineChart, drawTreemap } = require('./utils/pdfChart.util');
const PDFDocument = require('pdfkit-table');
const InspectionBatch = require('../../models/InspectionBatch.model');
const InspectionTask = require('../../models/InspectionTask.model');
const Project = require('../../models/Project.model');
const MasterList = require('../../models/MasterList.model');

class ReportService {
  async getConfig() {
    const batches = await InspectionBatch.find({}).sort({ createdAt: -1 }).lean();

    const projectsMap = new Map();
    const projectDocs = await Project.find({}).lean();
    const projNameMap = new Map();
    projectDocs.forEach(p => projNameMap.set(p.code, p.fullName || p.name));

    for (const batch of batches) {
      const pCode = batch.project;
      if (!projectsMap.has(pCode)) {
        projectsMap.set(pCode, {
          id: pCode,
          name: projNameMap.get(pCode) || pCode,
          cycles: []
        });
      }

      const dateStr = new Date(batch.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      projectsMap.get(pCode).cycles.push({
        id: batch._id.toString(),
        label: `${dateStr} - ${batch.name}`
      });
    }

    return {
      projects: Array.from(projectsMap.values())
    };
  }

  normalizeRemark(remark) {
    if (!remark) return '';
    const r = remark.trim().toLowerCase();

    if (r.includes('crack')) return 'Cracks';
    if (r.includes('vegetation')) return 'Due to Vegetation';
    if (r.includes('grass')) return 'Due to Grass';
    if (r.includes('tree')) return 'Due to Trees';
    if (r.includes('pruning')) return 'Due to Pruning';
    if (r.includes('median plant')) return 'Due to Median Plantation';
    if (r.includes('unhealthy')) return 'Unhealthy';

    if (r.includes('rutting') || r === 'rut') return 'Rutting';
    if (r.includes('pothole')) return 'Pothole';
    if (r.includes('patching') || r === 'patch') return 'Patching';
    if (r.includes('bleed')) return 'Bleeding';
    if (r.includes('ravell')) return 'Ravelling';
    if (r.includes('edge drop')) return 'Edge Drop';
    if (r.includes('uneven')) return 'Due to Unevenness';

    if (r.includes('dust')) return 'Due to Dust';
    if (r.includes('soil')) return 'Due to Soil';
    if (r.includes('settle')) return 'Due to Settlement';

    if (r.includes('fade')) return 'Faded';
    if (r.includes('damage')) return 'Damaged';
    if (r.includes('bent')) return 'Bent';
    if (r.includes('missing')) return 'Missing';
    if (r.includes('reflectivity') || r.includes('reflective')) return 'No Reflectivity';
    if (r.includes('not working') || r === 'not work') return 'Not Working';
    if (r.includes('fixing plate')) return 'Improper Fixing Plates';
    if (r.includes('structure numbering')) return 'No Structure Numbering';
    if (r.includes('no numbering') || (r.includes('numbering') && !r.includes('structure'))) return 'No Numbering';

    // Fallback: capitalize first letter of each word to look clean
    return remark.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  async getTasksForReport(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction) {
    const query = { project, status: 'COMPLETED' };
    if (cycleId && cycleId !== 'all') {
      query.batchId = cycleId;
    }

    if (roadType && roadType !== 'Both') {
      query.roadType = roadType;
    }

    if (direction && direction !== 'Both') {
      query.direction = direction;
    }

    if (chainageType === 'custom' && chainageFrom !== undefined && chainageTo !== undefined) {
      const cFrom = parseFloat(chainageFrom);
      const cTo = parseFloat(chainageTo);
      // Use $expr to cast string chainage to double for accurate numeric comparison in DB
      query.$expr = {
        $and: [
          { $gte: [{ $toDouble: "$chainage" }, cFrom] },
          { $lte: [{ $toDouble: "$chainage" }, cTo] }
        ]
      };
    }

    let rawTasks = await InspectionTask.find(query).populate('parameters').lean();

    if (chainageType === 'custom' && chainageFrom !== undefined && chainageTo !== undefined) {
      const cFrom = parseFloat(chainageFrom);
      const cTo = parseFloat(chainageTo);
      rawTasks = rawTasks.filter(t => {
        const cVal = parseFloat(t.chainage);
        return !isNaN(cVal) && cVal >= cFrom && cVal <= cTo;
      });
    }

    let tasks = [];
    rawTasks.forEach(t => {
      const isRoadway = (t.category || t.assetType || '').toLowerCase().includes('roadway');
      if (isRoadway && t.ratings && t.ratings.length > 0) {
        const groups = {};
        t.ratings.forEach(r => {
          const g = r.group || 'Roadway';
          if (!groups[g]) groups[g] = [];
          groups[g].push(r);
        });

        Object.keys(groups).forEach(g => {
          const clonedTask = JSON.parse(JSON.stringify(t));
          clonedTask.ratings = groups[g];
          clonedTask.assetType = g;
          if (clonedTask.parameters) {
            clonedTask.parameters.forEach(p => { if (p) p.assetType = g; });
          }
          tasks.push(clonedTask);
        });
      } else {
        tasks.push(t);
      }
    });

    // Normalize assetType to avoid case-sensitivity duplicates
    const assetMap = new Map();
    tasks.forEach(t => {
      if (t.assetType) {
        const lower = t.assetType.trim().toLowerCase();
        if (!assetMap.has(lower)) assetMap.set(lower, t.assetType.trim());
        t.assetType = assetMap.get(lower);
      }
      if (t.parameters) {
        t.parameters.forEach(p => {
          if (p && p.assetType) {
            const pLower = p.assetType.trim().toLowerCase();
            if (!assetMap.has(pLower)) assetMap.set(pLower, p.assetType.trim());
            p.assetType = assetMap.get(pLower);
          }
        });
      }
    });

    if (selectedAssetType && selectedAssetType !== 'all') {
      const lowerSelected = selectedAssetType.trim().toLowerCase();
      tasks = tasks.filter(t => {
        const tAsset = t.assetType ? t.assetType.trim().toLowerCase() : '';
        return tAsset === lowerSelected;
      });
    }

    if (selectedParameter && selectedParameter !== 'all') {
      const lowerParam = selectedParameter.trim().toLowerCase();
      tasks = tasks.map(t => {
        if (t.ratings && t.ratings.length > 0) {
          t.ratings = t.ratings.filter(r => {
            const paramDoc = t.parameters && t.parameters.find(p => p && p._id && r.masterListId && p._id.toString() === r.masterListId.toString());
            const parameter = (paramDoc && paramDoc.parameter) || r.parameterName || r.parameterKey || 'Unknown';
            return parameter.trim().toLowerCase() === lowerParam;
          });
        }
        return t;
      }).filter(t => t.ratings && t.ratings.length > 0);
    }

    return tasks;
  }

  async getAssetTypes(project, cycleId, roadType, direction) {
    const tasks = await this.getTasksForReport(project, cycleId, undefined, undefined, undefined, undefined, undefined, roadType, direction);
    const allRatings = this.flattenRatingsForAnalysis(tasks);

    const assetMap = {};
    allRatings.forEach(r => {
      if (r.assetType && r.assetType !== 'Unknown') {
        if (!assetMap[r.assetType]) {
          assetMap[r.assetType] = new Set();
        }
        if (r.parameter && r.parameter !== 'Unknown') {
          assetMap[r.assetType].add(r.parameter);
        }
      }
    });

    const result = Object.keys(assetMap).map(asset => ({
      assetType: asset,
      parameters: Array.from(assetMap[asset]).sort()
    })).sort((a, b) => a.assetType.localeCompare(b.assetType));

    return result;
  }

  flattenRatingsForAnalysis(tasks) {
    const allRatings = [];
    tasks.forEach(t => {
      if (t.ratings && t.ratings.length > 0) {
        t.ratings.forEach(r => {
          const paramDoc = t.parameters && t.parameters.find(p => p && p._id && r.masterListId && p._id.toString() === r.masterListId.toString());
          const category = (paramDoc && paramDoc.category) || t.category || t.assetType || 'Unknown';
          const assetType = (paramDoc && paramDoc.assetType) || t.assetType || 'Unknown';
          const parameter = (paramDoc && paramDoc.parameter) || r.parameterName || r.parameterKey || 'Unknown';

          let direction = (paramDoc && paramDoc.direction) || t.direction || '-';
          if (direction !== 'LHS' && direction !== 'RHS') {
            direction = '-';
          }

          allRatings.push({
            project: t.project,
            category: category,
            assetType: assetType,
            chainage: parseFloat(t.chainage) || 0,
            direction: direction,
            parameter: parameter,
            score: Number(r.score) || 0,
            remark: this.normalizeRemark(r.remark),
            ratedAt: t.updatedAt || t.createdAt,
            imageUrl: t.image?.cloudinaryUrl || ''
          });
        });
      }
    });
    return allRatings;
  }

  async getSummary(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction) {
    const tasks = await this.getTasksForReport(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);

    let totalRatings = 0;
    const chainages = new Set();
    const parametersRated = new Set();
    let criticalRatings = 0;
    let sumScore = 0;

    let minDate = new Date();
    let maxDate = new Date(0);

    let minChainage = Number.MAX_VALUE;
    let maxChainage = -Number.MAX_VALUE;

    const catCounts = {};

    for (const t of tasks) {
      if (t.ratings && t.ratings.length > 0) {
        chainages.add(t.chainage);
        const chVal = parseFloat(t.chainage);
        if (!isNaN(chVal)) {
          if (chVal < minChainage) minChainage = chVal;
          if (chVal > maxChainage) maxChainage = chVal;
        }
        for (const r of t.ratings) {
          totalRatings++;
          const paramDoc = t.parameters && t.parameters.find(p => p && p._id && r.masterListId && p._id.toString() === r.masterListId.toString());
          const parameter = (paramDoc && paramDoc.parameter) || r.parameterName || r.parameterKey || 'Unknown';
          parametersRated.add(parameter);
          const score = Number(r.score) || 0;
          if (score === 1) criticalRatings++;
          sumScore += score;

          const category = (paramDoc && paramDoc.category) || t.category || t.assetType || 'Unknown';
          if (category !== 'Unknown') {
            catCounts[category] = (catCounts[category] || 0) + 1;
          }
        }
      }
      if (t.createdAt) {
        const d = new Date(t.createdAt);
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      }
    }

    let dateRange = '-';
    let chainageRange = '-';
    if (totalRatings > 0) {
      const start = minDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const end = maxDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      dateRange = start === end ? start : `${start} to ${end}`;

      if (chainageType === 'custom' && chainageFrom !== undefined && chainageTo !== undefined) {
        const fromFormatted = parseFloat(chainageFrom).toFixed(2);
        const toFormatted = parseFloat(chainageTo).toFixed(2);
        chainageRange = `${fromFormatted} km to ${toFormatted} km`;
      } else if (minChainage !== Number.MAX_VALUE && maxChainage !== -Number.MAX_VALUE) {
        const minFormatted = minChainage.toFixed(2);
        const maxFormatted = maxChainage.toFixed(2);
        chainageRange = minFormatted === maxFormatted ? `${minFormatted} km` : `${minFormatted} km to ${maxFormatted} km`;
      }
    }

    let displayProjectName = project;
    if (project && project.replace(/[\s-]/g, '').toUpperCase().startsWith('GMCBS')) {
      displayProjectName = 'Bareilly - Sitapur Section of NH-30 (old NH-24) in the State of Uttar Pradesh';
    }

    let mainCategory = '';
    let maxCatCount = 0;
    for (const [cat, count] of Object.entries(catCounts)) {
      if (count > maxCatCount) {
        maxCatCount = count;
        mainCategory = cat;
      }
    }

    return {
      projectName: displayProjectName, // We could map to full name
      mainCategory,
      totalRatings,
      uniqueChainages: chainages.size,
      parametersRated: parametersRated.size,
      criticalRatings,
      averageRating: totalRatings > 0 ? (sumScore / totalRatings).toFixed(1) : 0,
      inspectionDateRange: dateRange,
      chainageRange
    };
  }

  async generateExcelReport(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction) {
    const tasks = await this.getTasksForReport(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
    const summary = await this.getSummary(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HiRATE Reports Module';
    workbook.created = new Date();

    // Reusable styles
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };
    const borderAll = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const allRatings = this.flattenRatingsForAnalysis(tasks);

    this.createExecutiveSummarySheet(workbook, summary, allRatings, tasks, headerFill, headerFont, borderAll);
    this.createParameterAnalysisSheet(workbook, tasks, headerFill, headerFont, borderAll);
    this.createCriticalIssuesSheet(workbook, allRatings, headerFill, headerFont, borderAll);
    this.createChainageHotspotsSheet(workbook, allRatings, headerFill, headerFont, borderAll);
    this.createCategoryAnalysisSheet(workbook, allRatings, headerFill, headerFont, borderAll);
    this.createDirectionAnalysisSheet(workbook, allRatings, headerFill, headerFont, borderAll);
    this.createRemarkAnalysisSheet(workbook, allRatings, headerFill, headerFont, borderAll);
    this.createImageEvidenceSheet(workbook, allRatings, headerFill, headerFont, borderAll);
    this.createRawRatingsSheet(workbook, allRatings, headerFill, headerFont, borderAll);

    return await workbook.xlsx.writeBuffer();
  }

  createExecutiveSummarySheet(workbook, summary, ratings, tasks, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Executive Summary');
    sheet.getColumn('A').width = 30;
    sheet.getColumn('B').width = 30;
    sheet.getColumn('C').width = 30;

    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `COMPREHENSIVE AUDIT REPORT: ${summary.projectName}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4E78' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Asset Audited vs Observation calculation
    const assetStats = {};
    let totalAudited = 0;
    let totalObservations = 0;

    tasks.forEach(t => {
      if (t.ratings && t.ratings.length > 0) {
        const firstR = t.ratings[0];
        const paramDoc = t.parameters && t.parameters.find(p => p && p._id && firstR.masterListId && p._id.toString() === firstR.masterListId.toString());
        const assetType = (paramDoc && paramDoc.assetType) || t.assetType || 'Unknown';

        if (!assetStats[assetType]) assetStats[assetType] = { audited: 0, observation: 0 };
        assetStats[assetType].audited++;
        totalAudited++;

        const hasObs = t.ratings.some(r => Number(r.score) === 1 || Number(r.score) === 5);
        if (hasObs) {
          assetStats[assetType].observation++;
          totalObservations++;
        }
      }
    });

    sheet.getCell('A3').value = 'Project Name'; sheet.getCell('B3').value = summary.projectName;
    sheet.getCell('A4').value = 'Chainage range'; sheet.getCell('B4').value = summary.chainageRange;
    sheet.getCell('A5').value = 'Date of Auditing'; sheet.getCell('B5').value = summary.inspectionDateRange;
    sheet.getCell('A6').value = 'Total Audited'; sheet.getCell('B6').value = totalAudited;
    sheet.getCell('A7').value = 'Total Observations'; sheet.getCell('B7').value = totalObservations;
    sheet.getCell('A8').value = '% Observations'; sheet.getCell('B8').value = totalAudited > 0 ? Math.round((totalObservations / totalAudited) * 100) + '%' : '0%';

    // Bold A3:A8
    for (let i = 3; i <= 8; i++) {
      sheet.getCell(`A${i}`).font = { bold: true };
    }

    let currentRow = 12;

    const assetRows = Object.entries(assetStats).map(([type, counts]) => ({ type, ...counts }));
    if (assetRows.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'Asset Audited Summary';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      sheet.getColumn('D').width = 20;

      sheet.getCell(`A${currentRow}`).value = 'Asset type';
      sheet.getCell(`B${currentRow}`).value = 'total audited';
      sheet.getCell(`C${currentRow}`).value = 'total observation';
      sheet.getCell(`D${currentRow}`).value = '% observation';
      ['A', 'B', 'C', 'D'].forEach(c => {
        sheet.getCell(`${c}${currentRow}`).fill = headerFill;
        sheet.getCell(`${c}${currentRow}`).font = headerFont;
        sheet.getCell(`${c}${currentRow}`).border = borderAll;
      });
      currentRow++;

      assetRows.forEach(row => {
        sheet.getCell(`A${currentRow}`).value = row.type;
        sheet.getCell(`B${currentRow}`).value = row.audited;
        sheet.getCell(`C${currentRow}`).value = row.observation;

        const percentage = row.audited > 0 ? Math.round((row.observation / row.audited) * 100) + '%' : '0%';
        sheet.getCell(`D${currentRow}`).value = percentage;

        ['A', 'B', 'C', 'D'].forEach(c => sheet.getCell(`${c}${currentRow}`).border = borderAll);
        currentRow++;
      });

      // Grand Total Row
      sheet.getCell(`A${currentRow}`).value = 'Grand Total';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = totalAudited;
      sheet.getCell(`B${currentRow}`).font = { bold: true };
      sheet.getCell(`C${currentRow}`).value = totalObservations;
      sheet.getCell(`C${currentRow}`).font = { bold: true };

      const totalPercentage = totalAudited > 0 ? Math.round((totalObservations / totalAudited) * 100) + '%' : '0%';
      sheet.getCell(`D${currentRow}`).value = totalPercentage;
      sheet.getCell(`D${currentRow}`).font = { bold: true };

      ['A', 'B', 'C', 'D'].forEach(c => sheet.getCell(`${c}${currentRow}`).border = borderAll);
      currentRow++;

      currentRow++;
    }

    // Key Findings
    sheet.getCell(`A${currentRow}`).value = 'Key Findings';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    let findings = [];
    if (summary.totalRatings === 0) {
      findings.push("No rating data available for this selection.");
    } else {
      let maxObs = 0;
      let worstAsset = null;
      for (const [assetType, stats] of Object.entries(assetStats)) {
        if (stats.observation > maxObs) {
          maxObs = stats.observation;
          worstAsset = assetType;
        }
      }

      if (worstAsset && maxObs > 0) {
        findings.push(`The '${worstAsset}' asset type requires the most urgent attention, with a total of ${maxObs} observations recorded during the inspection.`);
      } else {
        findings.push("No critical observations found across any asset types.");
      }
    }

    findings.forEach((f) => {
      sheet.getCell(`A${currentRow}`).value = `• ${f}`;
      currentRow++;
    });
  }

  createParameterAnalysisSheet(workbook, tasks, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Parameter Analysis');
    sheet.columns = [
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Asset Type', key: 'assetType', width: 25 },
      { header: 'Total Audited', key: 'totalAudited', width: 15 },
      { header: 'Total Observations', key: 'totalObservations', width: 15 },
      { header: '% observation', key: 'obsPct', width: 15 },
      { header: '1 Rating', key: 'c1', width: 12 },
      { header: '5 rating', key: 'c5', width: 12 },
      { header: '10 rating', key: 'c10', width: 12 }
    ];

    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:H1';

    const paramMap = {};
    tasks.forEach(t => {
      if (t.ratings && t.ratings.length > 0) {
        const firstR = t.ratings[0];
        const paramDoc = t.parameters && t.parameters.find(p => p && p._id && firstR.masterListId && p._id.toString() === firstR.masterListId.toString());
        const category = (paramDoc && paramDoc.category) || t.category || t.assetType || 'Unknown';
        const assetType = (paramDoc && paramDoc.assetType) || t.assetType || 'Unknown';

        const key = `${category}_${assetType}`;
        if (!paramMap[key]) {
          paramMap[key] = { c: category, a: assetType, audited: 0, observation: 0, c1: 0, c5: 0, c10: 0 };
        }
        paramMap[key].audited++;

        const hasObs = t.ratings.some(r => Number(r.score) === 1 || Number(r.score) === 5);
        if (hasObs) {
          paramMap[key].observation++;
        }
        let taskScore = 10;
        t.ratings.forEach(r => {
          const score = Number(r.score) || 0;
          if (score === 1) taskScore = 1;
          else if (score === 5 && taskScore !== 1) taskScore = 5;
        });

        if (taskScore === 1) paramMap[key].c1++;
        else if (taskScore === 5) paramMap[key].c5++;
        else paramMap[key].c10++;
      }
    });

    const rows = Object.values(paramMap).map(pm => {
      return {
        category: pm.c, assetType: pm.a,
        totalAudited: pm.audited, totalObservations: pm.observation,
        obsPct: pm.audited > 0 ? Math.round((pm.observation / pm.audited) * 100) + '%' : '0%',
        c1: pm.c1, c5: pm.c5, c10: pm.c10
      };
    });

    rows.sort((a, b) => b.totalObservations - a.totalObservations || b.totalAudited - a.totalAudited);
    rows.forEach(r => sheet.addRow(r));
  }

  createCriticalIssuesSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Critical Observations');
    sheet.columns = [
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Project', key: 'project', width: 15 },
      { header: 'Chainage', key: 'chainage', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Asset Type', key: 'assetType', width: 20 },
      { header: 'Direction', key: 'direction', width: 15 },
      { header: 'Parameter', key: 'parameter', width: 25 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Remark', key: 'remark', width: 30 },
      { header: 'Rated At', key: 'ratedAt', width: 25 },
      { header: 'Image', key: 'image', width: 15 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:K1';

    const criticals = ratings.filter(r => r.score === 1).map(r => ({
      priority: 'CRITICAL',
      project: r.project, chainage: r.chainage, category: r.category,
      assetType: r.assetType, direction: r.direction, parameter: r.parameter,
      score: r.score, remark: r.remark,
      ratedAt: new Date(r.ratedAt).toLocaleString(),
      image: r.imageUrl
    }));

    criticals.forEach(r => {
      const row = sheet.addRow(r);
      if (r.image) {
        row.getCell('image').value = { text: 'View Image', hyperlink: r.image, tooltip: 'Click to open image' };
        row.getCell('image').font = { color: { argb: 'FF0563C1' }, underline: true };
      }
    });
  }

  createChainageHotspotsSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Chainage Hotspots');
    sheet.columns = [
      { header: 'Chainage', key: 'chainage', width: 15 },
      { header: 'Total Observations', key: 'tot', width: 15 },
      { header: 'Critical Observations', key: 'crit', width: 15 },
      { header: 'Avg Rating', key: 'avg', width: 15 },
      { header: 'Affected Categories', key: 'cats', width: 30 },
      { header: 'Affected Parameters', key: 'params', width: 40 },
      { header: 'Priority', key: 'priority', width: 15 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:G1';

    const hotMap = {};
    ratings.forEach(r => {
      if (!hotMap[r.chainage]) hotMap[r.chainage] = { ch: r.chainage, tot: 0, crit: 0, sum: 0, cats: new Set(), params: new Set() };
      const h = hotMap[r.chainage];
      if (r.score === 1 || r.score === 5) h.tot++;
      if (r.score === 1) h.crit++;
      h.sum += r.score; // wait, average of all or issues? Average of all ratings at this chainage
      h.cats.add(r.category);
      if (r.score === 1 || r.score === 5) h.params.add(r.parameter);
    });

    const rows = Object.values(hotMap).map(h => {
      let p = 'LOW';
      if (h.crit > 2) p = 'CRITICAL';
      else if (h.crit > 0 || h.tot > 3) p = 'HIGH';
      else if (h.tot > 1) p = 'MEDIUM';

      return {
        chainage: h.ch,
        tot: h.tot,
        crit: h.crit,
        avg: h.tot > 0 ? (h.sum / ratings.filter(x => x.chainage === h.ch).length).toFixed(2) : 10,
        cats: Array.from(h.cats).join(', '),
        params: Array.from(h.params).join(', '),
        priority: p
      };
    }).filter(h => h.tot > 0);

    rows.sort((a, b) => b.crit - a.crit || b.tot - a.tot);
    rows.forEach(r => sheet.addRow(r));
  }

  createCategoryAnalysisSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Category Analysis');
    sheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Total Ratings', key: 'tot', width: 15 },
      { header: 'Average Score', key: 'avg', width: 15 },
      { header: 'Critical', key: 'c1', width: 10 },
      { header: 'High', key: 'c5', width: 10 },
      { header: 'Good', key: 'c10', width: 10 },
      { header: 'Critical %', key: 'critPct', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:H1';

    const catMap = {};
    ratings.forEach(r => {
      if (!catMap[r.category]) catMap[r.category] = { c: r.category, tot: 0, sum: 0, c1: 0, c5: 0, c10: 0 };
      const cm = catMap[r.category];
      cm.tot++; cm.sum += r.score;
      if (r.score === 1) cm.c1++;
      if (r.score === 5) cm.c5++;
      if (r.score === 10) cm.c10++;
    });

    Object.values(catMap).map(cm => {
      const pct = (cm.c1 / cm.tot) * 100;
      let stat = 'Healthy';
      if (pct > 15) stat = 'Critical';
      else if (pct > 5 || (cm.c5 / cm.tot) * 100 > 20) stat = 'Needs Attention';
      sheet.addRow({
        category: cm.c, tot: cm.tot, avg: (cm.sum / cm.tot).toFixed(2),
        c1: cm.c1, c5: cm.c5, c10: cm.c10, critPct: pct.toFixed(1), status: stat
      });
    });
  }

  createDirectionAnalysisSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Direction Analysis');
    sheet.columns = [
      { header: 'Direction', key: 'dir', width: 15 },
      { header: 'Total Ratings', key: 'tot', width: 15 },
      { header: 'Average Rating', key: 'avg', width: 15 },
      { header: 'Critical Observations', key: 'c1', width: 15 },
      { header: 'Critical %', key: 'critPct', width: 15 },
      { header: 'Rating 5', key: 'c5', width: 10 },
      { header: 'Rating 10', key: 'c10', width: 10 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });

    const dirMap = { LHS: { tot: 0, sum: 0, c1: 0, c5: 0, c10: 0 }, RHS: { tot: 0, sum: 0, c1: 0, c5: 0, c10: 0 }, BHS: { tot: 0, sum: 0, c1: 0, c5: 0, c10: 0 } };
    ratings.forEach(r => {
      let direction = r.direction;
      if (direction !== 'LHS' && direction !== 'RHS') {
        direction = 'BHS';
      }
      if (dirMap[direction]) {
        const d = dirMap[direction];
        d.tot++; d.sum += r.score;
        if (r.score === 1) d.c1++;
        if (r.score === 5) d.c5++;
        if (r.score === 10) d.c10++;
      }
    });

    ['LHS', 'RHS', 'BHS'].forEach(d => {
      if (dirMap[d].tot > 0) {
        const dm = dirMap[d];
        sheet.addRow({
          dir: d, tot: dm.tot, avg: (dm.sum / dm.tot).toFixed(2),
          c1: dm.c1, critPct: ((dm.c1 / dm.tot) * 100).toFixed(1),
          c5: dm.c5, c10: dm.c10
        });
      }
    });
  }

  createRemarkAnalysisSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Remark Analysis');
    sheet.columns = [
      { header: 'Remark', key: 'remark', width: 40 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Average Rating', key: 'avg', width: 15 },
      { header: 'Critical Count', key: 'crit', width: 15 },
      { header: 'Affected Categories', key: 'cats', width: 40 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:E1';

    const rmMap = {};
    ratings.forEach(r => {
      if (!r.remark) return;
      if (!rmMap[r.remark]) rmMap[r.remark] = { count: 0, sum: 0, crit: 0, cats: new Set() };
      const rm = rmMap[r.remark];
      rm.count++; rm.sum += r.score;
      if (r.score === 1) rm.crit++;
      rm.cats.add(r.category);
    });

    const rows = Object.entries(rmMap).map(([k, v]) => ({
      remark: k, count: v.count, avg: (v.sum / v.count).toFixed(2),
      crit: v.crit, cats: Array.from(v.cats).join(', ')
    }));
    rows.sort((a, b) => b.count - a.count);
    rows.forEach(r => sheet.addRow(r));
  }

  createImageEvidenceSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Image Evidence');
    sheet.columns = [
      { header: 'Chainage', key: 'chainage', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Asset Type', key: 'assetType', width: 20 },
      { header: 'Parameter', key: 'parameter', width: 25 },
      { header: 'Rating', key: 'score', width: 10 },
      { header: 'Remark', key: 'remark', width: 30 },
      { header: 'Direction', key: 'direction', width: 10 },
      { header: 'Rated At', key: 'rated At', width: 20 },
      { header: 'View Image', key: 'image', width: 15 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:I1';

    const evs = ratings.filter(r => r.score === 1 || r.score === 5);
    evs.sort((a, b) => a.score - b.score);

    evs.forEach(r => {
      const row = sheet.addRow({
        chainage: r.chainage, category: r.category, assetType: r.assetType, parameter: r.parameter,
        score: r.score, remark: r.remark, direction: r.direction, ratedAt: new Date(r.ratedAt).toLocaleString()
      });
      if (r.imageUrl) {
        row.getCell('image').value = { text: 'View Image', hyperlink: r.imageUrl };
        row.getCell('image').font = { color: { argb: 'FF0563C1' }, underline: true };
      }
    });
  }

  createRawRatingsSheet(workbook, ratings, headerFill, headerFont, borderAll) {
    const sheet = workbook.addWorksheet('Raw Ratings');
    sheet.columns = [
      { header: 'PROJECT', key: 'project', width: 15 },
      { header: 'CATEGORY', key: 'category', width: 20 },
      { header: 'ASSET TYPE', key: 'assetType', width: 20 },
      { header: 'CHAINAGE', key: 'chainage', width: 15 },
      { header: 'DIRECTION', key: 'direction', width: 10 },
      { header: 'PARAMETER', key: 'parameter', width: 25 },
      { header: 'SCORE', key: 'score', width: 10 },
      { header: 'REMARK', key: 'remark', width: 30 },
      { header: 'IMAGE URL', key: 'image', width: 40 },
      { header: 'RATED AT', key: 'ratedAt', width: 25 }
    ];
    sheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:J1';

    ratings.forEach(r => {
      sheet.addRow({
        project: r.project, category: r.category, assetType: r.assetType, chainage: r.chainage,
        direction: r.direction, parameter: r.parameter, score: r.score, remark: r.remark,
        image: r.imageUrl, ratedAt: new Date(r.ratedAt).toLocaleString()
      });
    });
  }

  async generatePdfReport(project, cycleId, res, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction, isSummary = false) {
    let tasks = await this.getTasksForReport(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);

    // Filter out MBCB and Delineators exclusively for the PDF report unless explicitly selected
    tasks = tasks.filter(t => {
      const assetType = t.assetType ? t.assetType.toLowerCase() : '';
      if (selectedAssetType && selectedAssetType !== 'all') {
        return true;
      }
      return assetType !== 'mbcb' && assetType !== 'delineators';
    });

    const summary = await this.getSummary(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);

    const PAGE_MARGINS = { top: 100, bottom: 50, left: 40, right: 40 };
    const doc = new PDFDocument({ margins: PAGE_MARGINS, size: 'A4', bufferPages: true });
    doc.on('error', err => console.error('PDF Document Error:', err));
    doc.pipe(res);

    // Theme Colors
    const primaryColor = '#1E3A8A'; // Deep Blue
    const textColor = '#374151'; // Dark Gray
    const altRowColor = '#F9FAFB'; // Light Gray Zebra
    const borderColor = '#E5E7EB'; // Subtle border

    let pageCount = 0;

    const drawHeaderAndFooter = (pageDoc, isLandscape = false) => {
      const width = pageDoc.page.width;
      const height = pageDoc.page.height;
      const margins = pageDoc.page.margins;

      // Temporarily remove margins to prevent auto-page breaking while drawing headers/footers
      const oldTop = margins.top;
      const oldBottom = margins.bottom;
      pageDoc.page.margins.top = 0;
      pageDoc.page.margins.bottom = 0;

      pageDoc.save();
      // Header Banner
      pageDoc.rect(0, 0, width, 75).fill(primaryColor);
      pageDoc.fillColor('white').fontSize(16).font('Helvetica-Bold')
        .text('COMPREHENSIVE AUDIT REPORT', margins.left, 20, { align: 'left', lineBreak: false });
      pageDoc.fontSize(11).font('Helvetica')
        .text(`Project: ${summary.projectName}`, margins.left, 45, { align: 'left', width: width - margins.left - margins.right, lineBreak: false });
      pageDoc.restore();

      // Footer Banner
      pageDoc.save();
      pageDoc.rect(0, height - 35, width, 35).fill('#F3F4F6');
      pageDoc.fillColor(textColor).fontSize(8).font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString()}`, margins.left, height - 22, { align: 'left', lineBreak: false });
      pageDoc.text(`Page ${pageCount}`, margins.left, height - 22, { align: 'right', width: width - margins.left - margins.right, lineBreak: false });
      pageDoc.restore();

      // Restore margins
      pageDoc.page.margins.top = oldTop;
      pageDoc.page.margins.bottom = oldBottom;
    };

    doc.on('pageAdded', () => {
      pageCount++;
      drawHeaderAndFooter(doc, doc.page.layout === 'landscape');
      doc.y = PAGE_MARGINS.top; // Reset Y so content doesn't overlap header
    });

    // We manually trigger the header/footer for the first page
    pageCount++;
    drawHeaderAndFooter(doc);
    doc.y = PAGE_MARGINS.top;

    // --- NEW CONDITIONAL PAGE: REPORT OVERVIEW ---
    const showReportOverview = (!selectedAssetType || selectedAssetType === 'all') && (!cycleId || cycleId === 'all');
    if (showReportOverview) {
      // Calculate Road Details
      const roadDetails = {
        LHS: { min: Infinity, max: -Infinity, uniqueChainages: new Set() },
        RHS: { min: Infinity, max: -Infinity, uniqueChainages: new Set() },
        MCW: { min: Infinity, max: -Infinity, uniqueChainages: new Set() },
        SR: { min: Infinity, max: -Infinity, uniqueChainages: new Set() },
        Total: { uniqueChainages: new Set() }
      };

      tasks.forEach(t => {
        if (!t.chainage) return;
        const chVal = parseFloat(t.chainage);
        if (isNaN(chVal)) return;

        const chStr = chVal.toFixed(2);
        roadDetails.Total.uniqueChainages.add(chStr);

        const rType = t.roadType || 'MCW';
        const dir = t.direction || 'LHS';

        if (dir === 'LHS' || dir === 'Both') {
          if (chVal < roadDetails.LHS.min) roadDetails.LHS.min = chVal;
          if (chVal > roadDetails.LHS.max) roadDetails.LHS.max = chVal;
          roadDetails.LHS.uniqueChainages.add(chStr);
        }
        if (dir === 'RHS' || dir === 'Both') {
          if (chVal < roadDetails.RHS.min) roadDetails.RHS.min = chVal;
          if (chVal > roadDetails.RHS.max) roadDetails.RHS.max = chVal;
          roadDetails.RHS.uniqueChainages.add(chStr);
        }

        if (rType === 'MCW') {
          if (chVal < roadDetails.MCW.min) roadDetails.MCW.min = chVal;
          if (chVal > roadDetails.MCW.max) roadDetails.MCW.max = chVal;
          roadDetails.MCW.uniqueChainages.add(chStr);
        }
        if (rType === 'SR') {
          if (chVal < roadDetails.SR.min) roadDetails.SR.min = chVal;
          if (chVal > roadDetails.SR.max) roadDetails.SR.max = chVal;
          roadDetails.SR.uniqueChainages.add(chStr);
        }
      });

      // Infer interval: sort unique chainages and find the most common diff
      let inferredInterval = 0.010; // Default 10m
      const sortedAll = Array.from(roadDetails.Total.uniqueChainages).map(parseFloat).sort((a, b) => a - b);
      if (sortedAll.length > 1) {
        const diffs = {};
        for (let i = 0; i < sortedAll.length - 1; i++) {
          const d = Math.abs(sortedAll[i + 1] - sortedAll[i]).toFixed(2);
          if (d > 0) diffs[d] = (diffs[d] || 0) + 1;
        }
        let maxCount = 0;
        for (const [diff, count] of Object.entries(diffs)) {
          if (count > maxCount) { maxCount = count; inferredInterval = parseFloat(diff); }
        }
      }

      const formatDetail = (detail) => {
        if (detail.min === Infinity) return { range: '-', coverage: '0.000 km', coverageVal: 0 };
        const coverageVal = detail.max - detail.min;
        return {
          range: `${detail.min.toFixed(2)} to ${detail.max.toFixed(2)} km`,
          coverage: coverageVal.toFixed(2) + ' km',
          coverageVal: coverageVal
        };
      };

      const formatTotal = (detail) => {
        return (detail.uniqueChainages.size * inferredInterval).toFixed(2) + ' km';
      };

      // Category Summary
      const catSummary = {};
      tasks.forEach(t => {
        let cat = 'Unknown';
        if (t.ratings && t.ratings.length > 0) {
          const firstR = t.ratings[0];
          const paramDoc = t.parameters && t.parameters.find(p => p && p._id && firstR.masterListId && p._id.toString() === firstR.masterListId.toString());
          cat = (paramDoc && paramDoc.category) || t.category || 'Unknown';
        } else {
          cat = t.category || 'Unknown';
        }

        // If category is still 'Unknown', it might be because it's not mapped to a high-level category. 
        // We will keep 'Unknown' if necessary, but we won't fallback to assetType.
        if (cat === 'Unknown') return; // Skip unknown categories based on request to only show main categories

        if (!catSummary[cat]) catSummary[cat] = { auditedSet: new Set(), obsSet: new Set() };

        const taskId = t._id ? t._id.toString() : Math.random().toString();
        catSummary[cat].auditedSet.add(taskId);

        if (t.ratings && t.ratings.some(r => Number(r.score) === 1 || Number(r.score) === 5)) {
          catSummary[cat].obsSet.add(taskId);
        }
      });

      const catRows = Object.entries(catSummary).map(([cat, data]) => {
        const audited = data.auditedSet.size;
        const obs = data.obsSet.size;
        const pct = audited > 0 ? Math.round((obs / audited) * 100) : 0;
        return { cat, audited, obs, pct };
      }).sort((a, b) => b.audited - a.audited);

      // Calculate overall stats for KPI based on category-wise audit summary table totals
      let ovTotalAudited = 0;
      let ovTotalObservations = 0;
      catRows.forEach(r => {
        ovTotalAudited += r.audited;
        ovTotalObservations += r.obs;
      });

      doc.fontSize(18).fillColor(primaryColor).font('Helvetica-Bold').text('Report Overview (Image - wise)');
      doc.moveDown(1.5);

      // Calculate road coverage data for KPI card (before KPI rendering)
      const mcwDetail = formatDetail(roadDetails.MCW);
      const srDetail = formatDetail(roadDetails.SR);
      const totalCoverageVal = mcwDetail.coverageVal + srDetail.coverageVal;
      const totalCoverage = totalCoverageVal.toFixed(2) + ' km';

      // --- KPI CARDS (4 metrics) ---
      const overviewKpiY = doc.y;
      const overviewPageWidth = 595 - 40 - 40;
      const overviewGap = 8;
      const overviewKpiWidth = (overviewPageWidth - (overviewGap * 3)) / 4;
      const overviewKpiHeight = 65;

      const ovObsRateStr = ovTotalAudited > 0 ? Math.round((ovTotalObservations / ovTotalAudited) * 100) + '%' : '0%';
      const overviewKpis = [
        {
          label: 'TOTAL AUDITED', value: ovTotalAudited.toString(),
          style: { bg: '#F4F8FE', border: '#D3E0F3', circleBg: '#E2EEFB', iconColor: '#174092', labelColor: '#174092', valColor: '#174092' }
        },
        {
          label: 'TOTAL OBSERVATIONS', value: ovTotalObservations.toString(),
          style: { bg: '#FEF9EF', border: '#FAEDD1', circleBg: '#FBEDD1', iconColor: '#C4770D', labelColor: '#9C6207', valColor: '#D97706' }
        },
        {
          label: 'OBSERVATION RATE %', value: ovObsRateStr,
          style: { bg: '#F2FBF5', border: '#D8F4E2', circleBg: '#DBF4E2', iconColor: '#1F8C3E', labelColor: '#116C2D', valColor: '#15803D' }
        },
        {
          label: 'TOTAL ROAD LENGTH', value: totalCoverageVal.toFixed(1) + ' km',
          style: { bg: '#F5F3FF', border: '#DDD6FE', circleBg: '#EDE9FE', iconColor: '#6D28D9', labelColor: '#5B21B6', valColor: '#7C3AED' }
        }
      ];

      doc.save();
      overviewKpis.forEach((kpi, idx) => {
        const x = 40 + (idx * (overviewKpiWidth + overviewGap));
        const { style } = kpi;

        doc.roundedRect(x, overviewKpiY, overviewKpiWidth, overviewKpiHeight, 6)
          .lineWidth(1)
          .fillAndStroke(style.bg, style.border);

        const cx = x + 20;
        const cy = overviewKpiY + (overviewKpiHeight / 2);
        doc.circle(cx, cy, 14).fill(style.circleBg);

        if (idx === 0) {
          // Clipboard with checkmark icon (line-style)
          doc.save();
          doc.roundedRect(cx - 6, cy - 7, 12, 16, 1.5).lineWidth(1.2).stroke(style.iconColor);
          doc.roundedRect(cx - 3, cy - 9.5, 6, 4, 1).lineWidth(1.2).stroke(style.iconColor);
          doc.moveTo(cx - 3.5, cy + 2).lineTo(cx - 1, cy + 5).lineTo(cx + 4.5, cy - 1.5).lineWidth(1.5).stroke(style.iconColor);
          doc.restore();
        } else if (idx === 1) {
          // Eye / observation icon (line-style)
          doc.save();
          doc.path(`M ${cx - 9},${cy} Q ${cx},${cy - 9} ${cx + 9},${cy} Q ${cx},${cy + 9} ${cx - 9},${cy} Z`).lineWidth(1.2).stroke(style.iconColor);
          doc.circle(cx, cy, 3.5).lineWidth(1.2).stroke(style.iconColor);
          doc.circle(cx, cy, 1.2).fill(style.iconColor);
          doc.restore();
        } else if (idx === 2) {
          // Percentage / donut-chart icon (line-style)
          doc.save();
          doc.circle(cx, cy, 9).lineWidth(1.2).stroke(style.iconColor);
          doc.path(`M ${cx},${cy} L ${cx},${cy - 8} A 8 8 0 1 1 ${cx - 5.6},${cy + 5.6} Z`).fill(style.iconColor);
          doc.circle(cx, cy, 3.5).fill(style.circleBg);
          doc.restore();
        } else if (idx === 3) {
          // Road/distance icon (line-style)
          doc.save();
          doc.moveTo(cx - 7, cy + 7).lineTo(cx - 2, cy - 7).lineWidth(1.2).stroke(style.iconColor);
          doc.moveTo(cx + 7, cy + 7).lineTo(cx + 2, cy - 7).lineWidth(1.2).stroke(style.iconColor);
          doc.moveTo(cx, cy - 5).lineTo(cx, cy - 2).lineWidth(1).stroke(style.iconColor);
          doc.moveTo(cx, cy).lineTo(cx, cy + 3).lineWidth(1).stroke(style.iconColor);
          doc.moveTo(cx, cy + 5).lineTo(cx, cy + 7).lineWidth(1).stroke(style.iconColor);
          doc.restore();
        }

        doc.fillColor(style.labelColor).fontSize(5.5).font('Helvetica-Bold')
          .text(kpi.label, x + 37, overviewKpiY + 16, { width: overviewKpiWidth - 39, align: 'center' });

        doc.fillColor(style.valColor).fontSize(16).font('Helvetica-Bold')
          .text(kpi.value, x + 37, overviewKpiY + 34, { width: overviewKpiWidth - 39, align: 'center' });
      });
      doc.restore();

      doc.x = 40;
      doc.y = overviewKpiY + overviewKpiHeight + 20;

      // Road icon + heading (properly spaced)
      const rdHeadingY = doc.y;
      doc.save();
      doc.moveTo(40, rdHeadingY + 14).lineTo(45, rdHeadingY + 2).lineWidth(1.2).stroke(primaryColor);
      doc.moveTo(54, rdHeadingY + 14).lineTo(49, rdHeadingY + 2).lineWidth(1.2).stroke(primaryColor);
      doc.moveTo(47, rdHeadingY + 3).lineTo(47, rdHeadingY + 5.5).lineWidth(1).stroke(primaryColor);
      doc.moveTo(47, rdHeadingY + 7.5).lineTo(47, rdHeadingY + 10).lineWidth(1).stroke(primaryColor);
      doc.moveTo(47, rdHeadingY + 12).lineTo(47, rdHeadingY + 14).lineWidth(1).stroke(primaryColor);
      doc.restore();
      doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold')
        .text('ROAD DETAILS', 60, rdHeadingY + 1);
      doc.x = 40;
      doc.moveDown(0.3);

      const roadTable = {
        headers: [
          { label: "Stream / Type", width: 140 },
          { label: "Distance / Range", width: 200 },
          { label: "Total length", width: 170 }
        ],
        rows: [
          ['MCW', mcwDetail.range, mcwDetail.coverage],
          ['SR', srDetail.range, srDetail.coverage],
          ['Grand Total (Total length)', '-', totalCoverage]
        ]
      };

      await doc.table(roadTable, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          if (indexColumn === 0 && indexRow % 2 !== 0) doc.addBackground(rectRow, altRowColor, 1);
          if (indexRow === 2) doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor);
          else doc.font("Helvetica").fontSize(9).fillColor(textColor);
        },
        divider: { header: { disabled: false, width: 1.5, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
      });

      doc.moveDown(1);

      // Bar chart icon + heading (properly spaced)
      const csHeadingY = doc.y;
      doc.save();
      doc.rect(40, csHeadingY + 8, 3, 6).fill(primaryColor);
      doc.rect(44.5, csHeadingY + 4, 3, 10).fill(primaryColor);
      doc.rect(49, csHeadingY + 7, 3, 7).fill(primaryColor);
      doc.rect(53.5, csHeadingY + 2, 3, 12).fill(primaryColor);
      doc.moveTo(39, csHeadingY + 15).lineTo(57.5, csHeadingY + 15).lineWidth(1.2).stroke(primaryColor);
      doc.restore();
      doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold')
        .text('CATEGORY-WISE AUDIT SUMMARY', 62, csHeadingY + 1);
      doc.x = 40;
      doc.moveDown(0.3);

      let catSumAudited = 0;
      let catSumObs = 0;
      const catRowsMapped = catRows.map(r => {
        catSumAudited += r.audited;
        catSumObs += r.obs;
        return [r.cat, r.audited.toString(), r.obs.toString(), r.pct + '%'];
      });
      const catSumPct = catSumAudited > 0 ? Math.round((catSumObs / catSumAudited) * 100) : 0;
      catRowsMapped.push(['Grand Total', catSumAudited.toString(), catSumObs.toString(), catSumPct + '%']);

      const catTable = {
        headers: [
          { label: "Category", width: 190 },
          { label: "Total Audited (Images/Records)", width: 170 },
          { label: "Total Observation", width: 100 },
          { label: "Observation %", width: 50 }
        ],
        rows: catRowsMapped
      };

      await doc.table(catTable, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          if (indexColumn === 0 && indexRow % 2 !== 0) doc.addBackground(rectRow, altRowColor, 1);
          if (indexRow === catRowsMapped.length - 1) doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor);
          else doc.font("Helvetica").fontSize(9).fillColor(textColor);
        },
        divider: { header: { disabled: false, width: 1.5, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
      });

      doc.addPage();
    }

      const renderConfig = { suffix: '' };

      let execTitle = 'Executive Summary';
      if (cycleId && cycleId !== 'all' && summary.mainCategory) {
        execTitle = `Executive Summary - ${summary.mainCategory}`;
      }
      execTitle += renderConfig.suffix;
      doc.fontSize(18).fillColor(primaryColor).font('Helvetica-Bold').text(execTitle);
      doc.moveDown(0.5);

      // Asset Audited vs Observation calculation
      const assetStats = {};
      let totalAudited = 0;
      let totalObservations = 0;
      let criticalObservations = 0;

      tasks.forEach(t => {
        if (t.ratings && t.ratings.length > 0) {
          const firstR = t.ratings[0];
          const paramDoc = t.parameters && t.parameters.find(p => p && p._id && firstR.masterListId && p._id.toString() === firstR.masterListId.toString());
          const assetType = (paramDoc && paramDoc.assetType) || t.assetType || 'Unknown';

          if (!assetStats[assetType]) assetStats[assetType] = { audited: 0, observation: 0 };
          assetStats[assetType].audited++;
          totalAudited++;

          const hasObs = t.ratings.some(r => Number(r.score) === 1 || Number(r.score) === 5);
          if (hasObs) {
            assetStats[assetType].observation++;
            totalObservations++;
          }

          const hasCrit = t.ratings.some(r => Number(r.score) === 1);
          if (hasCrit) {
            criticalObservations++;
          }
        }
      });

      const summaryTable = {
        headers: [
          { label: "Metric", property: 'label', width: 200 },
          { label: "Value", property: 'value', width: 200 }
        ],
        rows: [
          ['Project Name', summary.projectName],
          ['Chainage range', summary.chainageRange],
          ['Date of Auditing', summary.inspectionDateRange]
        ]
      };

      await doc.table(summaryTable, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          if (indexColumn === 0 && indexRow % 2 !== 0) {
            doc.addBackground(rectRow, altRowColor, 1);
          }
          doc.font("Helvetica").fontSize(10).fillColor(textColor);
        },
        hideHeader: true,
        divider: { header: { disabled: false, width: 1, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
      });

      doc.moveDown(1.5);

      // --- KPI CARDS ---
      const kpiY = doc.y;
      const pageWidth = 595 - 40 - 40; // 515
      const gap = 10;
      const kpiWidth = (pageWidth - (gap * 3)) / 4;
      const kpiHeight = 65; // Increased slightly to accommodate rounded look better and text wrapping

      const obsRateStr = totalAudited > 0 ? Math.round((totalObservations / totalAudited) * 100) + '%' : '0%';
      const kpis = [
        {
          label: 'TOTAL AUDITED', value: totalAudited.toString(),
          style: { bg: '#F4F8FE', border: '#D3E0F3', circleBg: '#E2EEFB', iconColor: '#174092', labelColor: '#174092', valColor: '#174092' }
        },
        {
          label: 'TOTAL OBSERVATIONS', value: totalObservations.toString(),
          style: { bg: '#FEF9EF', border: '#FAEDD1', circleBg: '#FBEDD1', iconColor: '#C4770D', labelColor: '#9C6207', valColor: '#D97706' }
        },
        {
          label: 'OBSERVATION RATE', value: obsRateStr,
          style: { bg: '#F2FBF5', border: '#D8F4E2', circleBg: '#DBF4E2', iconColor: '#1F8C3E', labelColor: '#116C2D', valColor: '#15803D' }
        },
        {
          label: 'CRITICAL OBSERVATIONS', value: criticalObservations.toString(),
          style: { bg: '#FDF2F2', border: '#FADADA', circleBg: '#FCE0E0', iconColor: '#D92D20', labelColor: '#9E1810', valColor: '#DC2626' }
        }
      ];

      doc.save();
      kpis.forEach((kpi, idx) => {
        const x = 40 + (idx * (kpiWidth + gap));
        const { style } = kpi;

        doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 6)
          .lineWidth(1)
          .fillAndStroke(style.bg, style.border);

        const cx = x + 23;
        const cy = kpiY + (kpiHeight / 2);
        doc.circle(cx, cy, 16).fill(style.circleBg);

        if (idx === 0) {
          doc.roundedRect(cx - 7, cy - 9, 14, 18, 2).fill(style.iconColor);
          doc.rect(cx - 3, cy - 11, 6, 4).fill(style.iconColor);
          doc.moveTo(cx - 3, cy + 1).lineTo(cx - 1, cy + 4).lineTo(cx + 4, cy - 2).lineWidth(1.5).stroke('#FFFFFF');
        } else if (idx === 1) {
          doc.polygon([cx, cy - 9], [cx - 9, cy + 6], [cx + 9, cy + 6]).fill(style.iconColor);
          doc.rect(cx - 1, cy - 3, 2, 5).fill('#FFFFFF');
          doc.circle(cx, cy + 4, 1).fill('#FFFFFF');
        } else if (idx === 2) {
          doc.path(`M ${cx - 1},${cy + 1} L ${cx - 1},${cy - 8} A 9 9 0 1 0 ${cx + 8},${cy + 1} Z`).fill(style.iconColor);
          doc.path(`M ${cx + 1},${cy - 1} L ${cx + 10},${cy - 1} A 9 9 0 0 0 ${cx + 1},${cy - 10} Z`).fill(style.iconColor);
        } else if (idx === 3) {
          doc.lineWidth(1.5).stroke(style.iconColor);
          doc.moveTo(cx - 10, cy - 10).lineTo(cx - 7, cy - 7).stroke();
          doc.moveTo(cx + 10, cy - 10).lineTo(cx + 7, cy - 7).stroke();
          doc.moveTo(cx - 10, cy + 10).lineTo(cx - 7, cy + 7).stroke();
          doc.moveTo(cx + 10, cy + 10).lineTo(cx + 7, cy + 7).stroke();
          doc.circle(cx, cy, 9).fill(style.iconColor);
          doc.rect(cx - 1, cy - 4, 2, 5).fill('#FFFFFF');
          doc.circle(cx, cy + 3.5, 1.2).fill('#FFFFFF');
        }

        doc.fillColor(style.labelColor).fontSize(5.5).font('Helvetica-Bold')
          .text(kpi.label, x + 41, kpiY + 16, { width: kpiWidth - 43, align: 'center' });

        doc.fillColor(style.valColor).fontSize(18).font('Helvetica-Bold')
          .text(kpi.value, x + 41, kpiY + 34, { width: kpiWidth - 43, align: 'center' });
      });
      doc.restore();

      doc.x = 40;
      doc.y = kpiY + kpiHeight + 25;
      // -----------------

      const assetRows = Object.entries(assetStats).map(([type, counts]) => ({ type, ...counts }));

      if (assetRows.length > 0) {
        doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold').text('Asset Audited Summary');
        doc.moveDown(0.5);

        // Sort asset rows alphabetically by Asset Type (ascending), then by Observation% (descending)
        assetRows.sort((a, b) => {
          const typeCompare = a.type.localeCompare(b.type);
          if (typeCompare !== 0) return typeCompare;
          const pctA = a.audited > 0 ? (a.observation / a.audited) : 0;
          const pctB = b.audited > 0 ? (b.observation / b.audited) : 0;
          return pctB - pctA;
        });

        let maxObs = -1;
        let minObs = 1000000;
        assetRows.forEach(r => {
          const obs = r.observation || 0;
          if (obs > maxObs) maxObs = obs;
          if (obs < minObs) minObs = obs;
        });
        if (maxObs === 0 && minObs === 0) { maxObs = -1; minObs = -1; }

        const totalPercentage = totalAudited > 0 ? Math.round((totalObservations / totalAudited) * 100) + '%' : '0%';
        const rawTotalPercentage = totalAudited > 0 ? (totalObservations / totalAudited) * 100 : 0;

        const assetTable = {
          headers: [
            { label: "Asset Type", width: 140 },
            { label: "Total Audited", width: 75 },
            { label: "Total Observation", width: 95 },
            { label: "Observation% (Bar)", width: 200 }
          ],
          rows: [
            ...assetRows.map(r => {
              return [r.type, r.audited.toString(), r.observation.toString(), ''];
            }),
            ['Grand Total', totalAudited.toString(), totalObservations.toString(), '']
          ]
        };

        await doc.table(assetTable, {
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor),
          prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
            if (indexColumn === 0 && indexRow % 2 !== 0) {
              doc.addBackground(rectRow, altRowColor, 1);
            }

            if (indexRow === assetRows.length) {
              doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor);
            } else {
              doc.font("Helvetica").fontSize(9).fillColor(textColor);
            }

            if (indexRow < assetRows.length && indexColumn === 2 && rectCell) {
              const obs = parseInt(row[2], 10);
              if (obs === maxObs && maxObs !== -1) {
                doc.addBackground(rectCell, '#FEE2E2', 1);
                doc.fillColor('#DC2626').font("Helvetica-Bold");
              } else if (obs === minObs && minObs !== -1) {
                doc.addBackground(rectCell, '#DCFCE7', 1);
                doc.fillColor('#16A34A').font("Helvetica-Bold");
              }
            }

            if (indexColumn === 3 && rectCell) {
              const isGrandTotal = indexRow === assetRows.length;
              let rawPct = 0;
              if (isGrandTotal) {
                rawPct = rawTotalPercentage;
              } else {
                const r = assetRows[indexRow];
                rawPct = r.audited > 0 ? (r.observation / r.audited) * 100 : 0;
              }

              const barMaxWidth = 75;
              const barHeight = 8;
              const barWidth = (rawPct / 100) * barMaxWidth;

              const barX = rectCell.x + 5;
              const barY = rectCell.y + (rectCell.height / 2) - (barHeight / 2);

              let barColor = primaryColor;
              if (!isGrandTotal) {
                if (rawPct >= 66) barColor = '#DC2626'; // Red
                else if (rawPct >= 33) barColor = '#F59E0B'; // Amber
                else if (rawPct > 0) barColor = '#10B981'; // Green
              }

              doc.save();
              if (rawPct > 0) {
                doc.rect(barX, barY, barWidth, barHeight).fill(barColor);
              } else {
                doc.rect(barX, barY, 2, barHeight).fill('#E5E7EB');
              }

              doc.fillColor(textColor).fontSize(8).font(isGrandTotal ? 'Helvetica-Bold' : 'Helvetica')
                .text(Math.round(rawPct) + '%', barX + barMaxWidth + 5, rectCell.y + 4, { width: 25, align: 'right' });

              doc.restore();
            }
          },
          divider: { header: { disabled: false, width: 1.5, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
        });

        doc.moveDown(1.5);
      }



      // =================================================================================
      // --- NEW IMG-LOD SECTION: OBSERVATION ANALYSIS (IMAGE-LEVEL) ---
      // =================================================================================
      doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
      doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis (Image-Level)${renderConfig.suffix}`, { align: 'center' });
      doc.moveDown(0.2);

      { // IMG-LOD Block Scope
        const imgStartY = doc.y;

        // 1. Calculations
        let imgR1Count = 0;
        let imgR5Count = 0;
        let imgR10Count = 0;

        const imgParamMap = {};
        const imgTreemapAssetParamMap = {};
        const imgDirStats = { 'LHS': { audited: 0, observations: 0 }, 'RHS': { audited: 0, observations: 0 }, 'BHS': { audited: 0, observations: 0 } };

        tasks.forEach(t => {
          // 1 unique image/task = 1 AUDITED UNIT
          let imgScore = 10;
          let firstRatingParams = null;

          if (t.ratings && t.ratings.length > 0) {
            const has1 = t.ratings.some(r => Number(r.score) === 1);
            const has5 = t.ratings.some(r => Number(r.score) === 5);
            if (has1) imgScore = 1;
            else if (has5) imgScore = 5;
            
            // To get direction, use the parameter of the rating that defined the score, or first rating
            let ratingForDir = t.ratings.find(r => Number(r.score) === imgScore) || t.ratings[0];
            firstRatingParams = t.parameters && t.parameters.find(p => p && p._id && ratingForDir.masterListId && p._id.toString() === ratingForDir.masterListId.toString());
          }

          if (imgScore === 1) imgR1Count++;
          else if (imgScore === 5) imgR5Count++;
          else imgR10Count++;

          // Direction-wise Observations
          let rawDir = (firstRatingParams && firstRatingParams.direction) || t.direction || '-';
          let direction = rawDir ? rawDir.toString().trim().toUpperCase() : 'BHS';
          if (direction !== 'LHS' && direction !== 'RHS') {
            direction = 'BHS';
          }

          if (imgDirStats[direction]) {
            imgDirStats[direction].audited++;
            if (imgScore === 1 || imgScore === 5) {
              imgDirStats[direction].observations++;
            }
          }

          // Parameter and Treemap Logic
          if (imgScore === 1 || imgScore === 5) {
            const seenParams = new Set();
            if (t.ratings) {
              t.ratings.forEach(r => {
                const rScore = Number(r.score);
                if (rScore === 1 || rScore === 5) {
                  const rpDoc = t.parameters && t.parameters.find(p => p && p._id && r.masterListId && p._id.toString() === r.masterListId.toString());
                  const tParam = (rpDoc && rpDoc.parameter) || r.parameterName || r.parameterKey || 'Unknown';
                  const aType = (rpDoc && rpDoc.assetType) || t.assetType || 'Unknown';

                  const uniqueKey = aType + '___' + tParam;
                  if (tParam !== 'Unknown' && !seenParams.has(uniqueKey)) {
                    seenParams.add(uniqueKey);
                    imgParamMap[tParam] = (imgParamMap[tParam] || 0) + 1;
                    if (!imgTreemapAssetParamMap[aType]) imgTreemapAssetParamMap[aType] = {};
                    imgTreemapAssetParamMap[aType][tParam] = (imgTreemapAssetParamMap[aType][tParam] || 0) + 1;
                  }
                }
              });
            }
          }
        });

        const totalImgDist = imgR1Count + imgR5Count + imgR10Count;

        const imgRatingDonutData = [
          { label: 'Critical (1)', value: imgR1Count, color: '#DC2626' },
          { label: 'Minor Defect (5)', value: imgR5Count, color: '#F59E0B' },
          { label: 'Good (10)', value: imgR10Count, color: '#10B981' }
        ].filter(d => d.value > 0);

        const imgDirClusteredData = [];
        if (imgDirStats['LHS'].audited > 0) imgDirClusteredData.push({ label: 'LHS', value1: imgDirStats['LHS'].audited, value2: imgDirStats['LHS'].observations, color1: '#3B82F6', color2: '#f44336' });
        if (imgDirStats['RHS'].audited > 0) imgDirClusteredData.push({ label: 'RHS', value1: imgDirStats['RHS'].audited, value2: imgDirStats['RHS'].observations, color1: '#3B82F6', color2: '#f44336' });
        if (imgDirStats['BHS'].audited > 0) imgDirClusteredData.push({ label: 'BHS', value1: imgDirStats['BHS'].audited, value2: imgDirStats['BHS'].observations, color1: '#3B82F6', color2: '#f44336' });

        const imgSortedParams = Object.entries(imgParamMap).sort((a, b) => b[1] - a[1]);
        const imgTop24ParamsArray = imgSortedParams.slice(0, 24);
        const imgTop24Params = new Set(imgTop24ParamsArray.map(entry => entry[0]));

        const imgParetoTotal = imgTop24ParamsArray.reduce((sum, entry) => sum + entry[1], 0);
        let imgParetoCum = 0;
        const imgParetoData = imgTop24ParamsArray.map(([k, v]) => {
          imgParetoCum += v;
          return { label: k, count: v, cumulative: imgParetoTotal > 0 ? (imgParetoCum / imgParetoTotal) * 100 : 0 };
        });

        const imgTreemapColors = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#38BDF8', '#818CF8', '#10B981', '#FCD34D'];
        let imgColorIndex = 0;
        const imgTreemapData = Object.keys(imgTreemapAssetParamMap).map(aType => {
          const children = Object.keys(imgTreemapAssetParamMap[aType])
            .filter(p => imgTop24Params.has(p))
            .map(p => ({
              name: p,
              value: imgTreemapAssetParamMap[aType][p]
            }));

          let assetGroupVal = 0;
          Object.values(imgTreemapAssetParamMap[aType]).forEach(val => assetGroupVal += val);
          
          const color = imgTreemapColors[imgColorIndex % imgTreemapColors.length];
          imgColorIndex++;
          return {
            name: aType,
            value: assetGroupVal,
            color,
            children
          };
        }).filter(g => g.value > 0 && g.children.length > 0);

        imgTreemapData.sort((a, b) => b.value - a.value);

        // --- RENDER VISUALS ---
        drawSectionBox(doc, 40, imgStartY, 375, 170, 'Rating Distribution (Overall)');
        if (totalImgDist > 0) {
          drawDonutChart(doc, 227.5, imgStartY + 75, 45, 20, imgRatingDonutData, 'Total Audited', totalImgDist.toString());
          let lX = 65;
          const lY = imgStartY + 145;
          imgRatingDonutData.forEach(item => {
            doc.circle(lX, lY, 4).fillColor(item.color).fill();
            doc.fillColor('#333333').fontSize(8).font('Helvetica').text(`${item.label} (${item.value})`, lX + 8, lY - 3);
            lX += 115;
          });
        } else {
          doc.fillColor('#666666').fontSize(10).text('No ratings found.', 50, imgStartY + 80);
        }

        doc.fillColor('#002b5c').fontSize(11).font('Helvetica-Bold').text('Direction-wise Observations', 435, imgStartY + 10);
        if (imgDirClusteredData.length > 0) {
          drawSectionBox(doc, 425, imgStartY, 375, 170, '');
          drawClusteredColumnChart(doc, 435, imgStartY + 35, 355, 120, imgDirClusteredData, 'Total Audited', 'Observations');
        } else {
          drawSectionBox(doc, 425, imgStartY, 375, 170, '');
          doc.fillColor('#666666').fontSize(10).text('Direction data not available', 435, imgStartY + 55);
        }

        const availableWidthForParams = 760;
        let cols = Math.min(Math.floor(availableWidthForParams / 180), Math.ceil(imgParetoData.length / 8));
        if (cols < 1) cols = 1;
        
        const rowHeight = 28;
        const maxItemsPerColFirstPage = Math.floor(130 / rowHeight);
        const maxItemsFirstPage = cols * maxItemsPerColFirstPage;
        
        let firstPagePareto = imgParetoData.slice(0, maxItemsFirstPage);
        let continuationPareto = imgParetoData.slice(maxItemsFirstPage);
        
        let actualItemsPerCol = Math.ceil(firstPagePareto.length / cols);
        let paramChartHeight = Math.max(120, actualItemsPerCol * rowHeight);
        let paramBoxHeight = Math.max(180, paramChartHeight + 50);

        drawSectionBox(doc, 40, imgStartY + 180, availableWidthForParams, paramBoxHeight, 'Observations by Parameter');
        
        if (firstPagePareto.length > 0) {
          const startX = 50;
          const startY = imgStartY + 215;
          const chartAreaWidth = availableWidthForParams - 20;
          const maxCount = Math.max(...imgParetoData.map(d => d.count), 1);
          const colWidth = chartAreaWidth / cols;
          const maxLabelW = 115;
          const barAreaW = colWidth - maxLabelW - 30;
          const bHeight = 8;
          
          doc.rect(startX + chartAreaWidth / 2 - 40, startY - 20, 8, 8).fillColor('#1976d2').fill();
          doc.fillColor('#333333').fontSize(8).font('Helvetica').text('Observations', startX + chartAreaWidth / 2 - 28, startY - 19);

          firstPagePareto.forEach((item, idx) => {
            const col = Math.floor(idx / actualItemsPerCol);
            const row = idx % actualItemsPerCol;
            const cStartX = startX + (col * colWidth) + (col > 0 ? 10 : 0);
            const cY = startY + (row * rowHeight);
            const barStartX = cStartX + maxLabelW + 5;
            
            doc.fillColor('#333333').fontSize(7.5).font('Helvetica').text(item.label, cStartX, cY + (rowHeight/2) - 10, { width: maxLabelW, align: 'left', lineBreak: true });
            const bW = (item.count / maxCount) * barAreaW;
            if (bW > 0) doc.rect(barStartX, cY + (rowHeight/2) - (bHeight/2), bW, bHeight).fillColor('#1976d2').fill();
            doc.fillColor('#333333').fontSize(8).font('Helvetica').text(item.count.toString(), barStartX + bW + 5, cY + (rowHeight/2) - 4);
          });
        }

        if (typeof continuationPareto !== 'undefined' && continuationPareto.length > 0) {
          const contRowHeight = 28;
          const maxRowsPerContPage = Math.floor(400 / contRowHeight);
          const itemsPerContPagePareto = 4 * maxRowsPerContPage;
          for (let i = 0; i < continuationPareto.length; i += itemsPerContPagePareto) {
            const chunk = continuationPareto.slice(i, i + itemsPerContPagePareto);
            doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
            doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis (Image-Level) (Continued)${renderConfig.suffix}`, { align: 'center' });
            doc.moveDown(1);
            
            const contStartY = doc.y;
            let contCols = Math.min(4, Math.ceil(chunk.length / maxRowsPerContPage));
            if (contCols < 1) contCols = 1;
            let contItemsPerCol = Math.ceil(chunk.length / contCols);
            let contChartHeight = Math.max(120, contItemsPerCol * contRowHeight);
            let contBoxHeight = Math.max(180, contChartHeight + 50);

            drawSectionBox(doc, 40, contStartY, 760, contBoxHeight, 'Observations by Parameter (Continued)');
            
            const startX = 50;
            const startY = contStartY + 35;
            const width = 740;
            const maxCount = Math.max(...imgParetoData.map(d => d.count), 1);
            const columnWidth = width / contCols;
            const maxLabelWidth = 115;
            const chartWidth = columnWidth - maxLabelWidth - 30;
            const bHeight = 8;
            
            doc.rect(startX + width / 2 - 40, startY - 20, 8, 8).fillColor('#1976d2').fill();
            doc.fillColor('#333333').fontSize(8).font('Helvetica').text('Observations', startX + width / 2 - 28, startY - 19);

            chunk.forEach((item, idx) => {
              const col = Math.floor(idx / contItemsPerCol);
              const row = idx % contItemsPerCol;
              const colStartX = startX + (col * columnWidth) + (col > 0 ? 10 : 0);
              const currentY = startY + (row * contRowHeight);
              const chartStartX = colStartX + maxLabelWidth + 5;
              
              doc.fillColor('#333333').fontSize(7.5).font('Helvetica').text(item.label, colStartX, currentY + (contRowHeight/2) - 10, { width: maxLabelWidth, align: 'left', lineBreak: true });
              const barW = (item.count / maxCount) * chartWidth;
              if (barW > 0) doc.rect(chartStartX, currentY + (contRowHeight/2) - (bHeight/2), barW, bHeight).fillColor('#1976d2').fill();
              doc.fillColor('#333333').fontSize(8).font('Helvetica').text(item.count.toString(), chartStartX + barW + 5, currentY + (contRowHeight/2) - 4);
            });
          }
        }

        if (imgTreemapData.length > 0) {
          doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
          doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis (Image-Level) (Continued)${renderConfig.suffix}`, { align: 'center' });
          doc.moveDown(1);
          const contStartY = doc.y;
          drawSectionBox(doc, 40, contStartY, 760, 400, 'Observation Breakdown by Asset & Parameter');
          drawTreemap(doc, 50, contStartY + 30, 740, 360, imgTreemapData);
        }
      } // End IMG-LOD Block Scope

      // --- PAGE 2: OBSERVATION ANALYSIS (Landscape) ---
      // We add a new page which will automatically trigger the header/footer drawing!
      doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
      doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis${renderConfig.suffix}`, { align: 'center' });
      doc.moveDown(0.2);

      { // Block scope to prevent variable redeclaration errors with Page 1
        const p2StartY = doc.y;
        const allRatings = this.flattenRatingsForAnalysis(tasks);

        // Use EXACT KPI match logic to guarantee data consistency
        let r1Count = criticalObservations;
        let r5Count = totalObservations - criticalObservations;
        let r10Count = totalAudited - totalObservations;

        const remarksMap = {};
        const paramMap = {};
        const assetParamMap = {};
        const treemapAssetParamMap = {};
        const chainageMap = {};
        const dirStats = { 'LHS': { audited: 0, issues: 0 }, 'RHS': { audited: 0, issues: 0 }, 'BHS': { audited: 0, issues: 0 } };

        tasks.forEach(t => {
          if (t.ratings && t.ratings.length > 0) {
            let assetScore = 10;
            let assetRatingDoc = null;

            // Align with KPI: is there ANY 1? If not, is there ANY 5?
            let crit = t.ratings.find(r => Number(r.score) === 1);
            let minor = t.ratings.find(r => Number(r.score) === 5);

            if (crit) {
              assetScore = 1;
              assetRatingDoc = crit;
            } else if (minor) {
              assetScore = 5;
              assetRatingDoc = minor;
            } else {
              assetScore = 10;
              assetRatingDoc = t.ratings[0];
            }

            let pDoc = null;
            if (assetRatingDoc) {
              pDoc = t.parameters && t.parameters.find(p => p && p._id && assetRatingDoc.masterListId && p._id.toString() === assetRatingDoc.masterListId.toString());
            }

            // Count ALL unique parameters per image that have score 1 or 5 (consistent image-wise logic)
            if (assetScore === 1 || assetScore === 5) {
              const seenParams = new Set();
              t.ratings.forEach(r => {
                const rScore = Number(r.score);
                if (rScore === 1 || rScore === 5) {
                  const rpDoc = t.parameters && t.parameters.find(p => p && p._id && r.masterListId && p._id.toString() === r.masterListId.toString());
                  const tParam = (rpDoc && rpDoc.parameter) || r.parameterName || r.parameterKey || 'Unknown';
                  const aType = (rpDoc && rpDoc.assetType) || t.assetType || 'Unknown';

                  if (tParam !== 'Unknown' && !seenParams.has(tParam)) {
                    seenParams.add(tParam);
                    paramMap[tParam] = (paramMap[tParam] || 0) + 1;
                    if (!assetParamMap[aType]) assetParamMap[aType] = {};
                    assetParamMap[aType][tParam] = (assetParamMap[aType][tParam] || 0) + 1;
                    if (!treemapAssetParamMap[aType]) treemapAssetParamMap[aType] = {};
                    treemapAssetParamMap[aType][tParam] = (treemapAssetParamMap[aType][tParam] || 0) + 1;
                  }
                }
              });
            }

            let rawDir = (pDoc && pDoc.direction) || t.direction || '-';
            let direction = rawDir ? rawDir.toString().trim().toUpperCase() : 'BHS';
            if (direction !== 'LHS' && direction !== 'RHS') {
              direction = 'BHS';
            }

            if (dirStats[direction]) {
              dirStats[direction].audited++;
              if (assetScore === 1 || assetScore === 5) {
                dirStats[direction].issues++;
              }
            }

            const cKey = `${t.chainage}_${assetScore}`;
            if (!chainageMap[cKey]) chainageMap[cKey] = { chainage: t.chainage, count: 0, rating: assetScore };
            chainageMap[cKey].count++;
          }
        });

        const totalDist = r1Count + r5Count + r10Count;

        // Deduplicate remarks by chainage per asset type to match Overall Remark Summary logic
        const uniqueRemarks = {};
        allRatings.forEach(r => {
          const cKey = `${r.assetType}_${r.chainage || '-'}`;
          if (!uniqueRemarks[cKey]) uniqueRemarks[cKey] = r;
        });
        Object.values(uniqueRemarks).forEach(r => {
          if (r.remark && r.remark.trim() !== '') {
            const rm = r.remark.trim();
            if (isNaN(rm) && rm.length > 1 && rm !== 'Unknown') {
              remarksMap[rm] = (remarksMap[rm] || 0) + 1;
            }
          }
        });

        const ratingDonutData = [
          { label: 'Critical (1)', value: r1Count, color: '#DC2626' },
          { label: 'Minor Defect (5)', value: r5Count, color: '#F59E0B' },
          { label: 'Good (10)', value: r10Count, color: '#10B981' }
        ].filter(d => d.value > 0);

        const assetBarData = assetRows.map(r => ({
          label: r.type,
          percentage: r.audited > 0 ? (r.observation / r.audited) * 100 : 0
        }));

        const sortedParams = Object.entries(paramMap).sort((a, b) => b[1] - a[1]);
        const top24ParamsArray = sortedParams.slice(0, 24);
        const top24Params = new Set(top24ParamsArray.map(entry => entry[0]));

        const paretoTotal = top24ParamsArray.reduce((sum, entry) => sum + entry[1], 0);
        let paretoCum = 0;
        const paretoData = top24ParamsArray.map(([k, v]) => {
          paretoCum += v;
          return { label: k, count: v, cumulative: paretoTotal > 0 ? (paretoCum / paretoTotal) * 100 : 0 };
        });
        const paramTotal = Object.values(paramMap).reduce((a, b) => a + b, 0);
        const paramColors = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'];
        const paramData = Object.entries(paramMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([k, v], i) => ({ label: k, value: v, color: paramColors[i % paramColors.length], percentage: paramTotal > 0 ? (v / paramTotal) * 100 : 0 }));

        const dirClusteredData = [];
        if (dirStats['LHS'].audited > 0) dirClusteredData.push({ label: 'LHS', value1: dirStats['LHS'].audited, value2: dirStats['LHS'].issues, color1: '#3B82F6', color2: '#f44336' });
        if (dirStats['RHS'].audited > 0) dirClusteredData.push({ label: 'RHS', value1: dirStats['RHS'].audited, value2: dirStats['RHS'].issues, color1: '#3B82F6', color2: '#f44336' });
        if (dirStats['BHS'].audited > 0) dirClusteredData.push({ label: 'BHS', value1: dirStats['BHS'].audited, value2: dirStats['BHS'].issues, color1: '#3B82F6', color2: '#f44336' });

        const scatterData = Object.values(chainageMap).map(c => ({
          chainage: c.chainage, count: c.count, rating: c.rating
        }));

        // Top Row (1. Rating Distribution, 2. Issue Rate)
        drawSectionBox(doc, 40, p2StartY, 375, 170, 'Rating Distribution (Overall)');
        if (totalDist > 0) {
          drawDonutChart(doc, 227.5, p2StartY + 75, 45, 20, ratingDonutData, 'Total Audited', totalDist.toString());
          let lX = 65;
          const lY = p2StartY + 145;
          ratingDonutData.forEach(item => {
            doc.circle(lX, lY, 4).fillColor(item.color).fill();
            doc.fillColor('#333333').fontSize(8).font('Helvetica').text(`${item.label} (${item.value})`, lX + 8, lY - 3);
            lX += 115;
          });
        } else {
          doc.fillColor('#666666').fontSize(10).text('No ratings found.', 50, p2StartY + 80);
        }

        const isAllAssets = (!selectedAssetType || selectedAssetType === 'all');
        const rowHeightLimit = 15;
        const itemsPerFirstPage = isAllAssets ? 0 : 12; // If 'all', push entirely to next page

        const treemapColors = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#38BDF8', '#818CF8', '#10B981', '#FCD34D'];
        let colorIndex = 0;
        const treemapData = Object.keys(treemapAssetParamMap).map(aType => {
          const children = Object.keys(treemapAssetParamMap[aType])
            .filter(p => top24Params.has(p))
            .map(p => ({
              name: p,
              value: treemapAssetParamMap[aType][p]
            }));

          // STRICTLY use the Asset-Level Issue Count as the group value, ensuring consistency with the asset bar chart
          const groupValue = assetStats[aType] ? assetStats[aType].observation : 0;

          const color = treemapColors[colorIndex % treemapColors.length];
          colorIndex++;
          return {
            name: aType,
            value: groupValue,
            color,
            children
          };
        }).filter(g => g.value > 0 && g.children.length > 0);

        treemapData.sort((a, b) => b.value - a.value);

        // ----------------------------------------------------
        // TOP ROW: Rating Distribution & Direction-wise Observations
        // ----------------------------------------------------
        // Direction-wise Observations moved to Top Right permanently
        doc.fillColor('#002b5c').fontSize(11).font('Helvetica-Bold').text('Direction-wise Observations', 435, p2StartY + 10);
        if (dirClusteredData.length > 0) {
          drawSectionBox(doc, 425, p2StartY, 375, 170, '');
          drawClusteredColumnChart(doc, 435, p2StartY + 35, 355, 120, dirClusteredData, 'Total Audited', 'Observations');
        } else {
          drawSectionBox(doc, 425, p2StartY, 375, 170, '');
          doc.fillColor('#666666').fontSize(10).text('Direction data not available', 435, p2StartY + 55);
        }

        // ----------------------------------------------------
        // MIDDLE ROW: Observations by Parameter (Full Width)
        // ----------------------------------------------------
        const availableWidthForParams = 760;
        
        let cols = Math.min(Math.floor(availableWidthForParams / 180), Math.ceil(paretoData.length / 8));
        if (cols < 1) cols = 1;
        
        // Increase row spacing: calculate based on 28pt per row for better readability
        const rowHeight = 28;
        const maxItemsPerColFirstPage = Math.floor(130 / rowHeight); // ~4 items
        const maxItemsFirstPage = cols * maxItemsPerColFirstPage;
        
        let firstPagePareto = paretoData.slice(0, maxItemsFirstPage);
        let continuationPareto = paretoData.slice(maxItemsFirstPage);
        
        let actualItemsPerCol = Math.ceil(firstPagePareto.length / cols);
        let paramChartHeight = Math.max(120, actualItemsPerCol * rowHeight);
        let paramBoxHeight = Math.max(180, paramChartHeight + 50);

        drawSectionBox(doc, 40, p2StartY + 180, availableWidthForParams, paramBoxHeight, 'Observations by Parameter');
        
        if (firstPagePareto.length > 0) {
          const startX = 50;
          const startY = p2StartY + 215;
          const chartAreaWidth = availableWidthForParams - 20;
          const maxCount = Math.max(...paretoData.map(d => d.count), 1);
          const colWidth = chartAreaWidth / cols;
          const maxLabelW = 115;
          const barAreaW = colWidth - maxLabelW - 30;
          const bHeight = 8; // Fixed small bar height
          
          doc.rect(startX + chartAreaWidth / 2 - 40, startY - 20, 8, 8).fillColor('#1976d2').fill();
          doc.fillColor('#333333').fontSize(8).font('Helvetica').text('Observations', startX + chartAreaWidth / 2 - 28, startY - 19);

          firstPagePareto.forEach((item, idx) => {
            const col = Math.floor(idx / actualItemsPerCol);
            const row = idx % actualItemsPerCol;
            const cStartX = startX + (col * colWidth) + (col > 0 ? 10 : 0);
            const cY = startY + (row * rowHeight);
            const barStartX = cStartX + maxLabelW + 5;
            
            // Text is vertically centered in the rowHeight
            doc.fillColor('#333333').fontSize(7.5).font('Helvetica').text(item.label, cStartX, cY + (rowHeight/2) - 10, { width: maxLabelW, align: 'left', lineBreak: true });
            const bW = (item.count / maxCount) * barAreaW;
            if (bW > 0) doc.rect(barStartX, cY + (rowHeight/2) - (bHeight/2), bW, bHeight).fillColor('#1976d2').fill();
            doc.fillColor('#333333').fontSize(8).font('Helvetica').text(item.count.toString(), barStartX + bW + 5, cY + (rowHeight/2) - 4);
          });
        }

        // Insights Box - Temporarily removed per user request
        /*
        drawSectionBox(doc, 40, p2StartY + 370, 760, 60, '');
        doc.circle(60, p2StartY + 400, 12).fillColor('#002b5c').fill();
        doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('i', 57, p2StartY + 394);
        doc.fillColor('#002b5c').fontSize(11).font('Helvetica-Bold').text('Key Insights', 80, p2StartY + 380);
        
        let insights = [];
        if (assetBarData.length > 0) insights.push(`'${assetBarData[0].label}' has the highest issue rate at ${assetBarData[0].percentage.toFixed(1)}%.`);
        if (paretoData.length > 0) insights.push(`'${paretoData[0].label}' is the most frequent observation reason.`);
        // if (paramData.length > 0) insights.push(`'${paramData[0].label}' is the most affected parameter.`);
        if (dirClusteredData.length > 0) insights.push(`'${[...dirClusteredData].sort((a,b)=>b.value2-a.value2)[0].label}' has the highest number of observations.`);
        if (insights.length === 0) insights.push("No insights available for this selection.");
        
        let curY = p2StartY + 395;
        doc.fillColor('#333333').fontSize(8).font('Helvetica');
        const col1 = insights.slice(0, 2);
        const col2 = insights.slice(2, 4);
        col1.forEach((ins, i) => { doc.text(`• ${ins}`, 80, curY + (i*15), { lineBreak: false }); });
        col2.forEach((ins, i) => { doc.text(`• ${ins}`, 440, curY + (i*15), { lineBreak: false }); });
        */

        // --- PAGE 3: ISSUE ANALYSIS (Continued) ---

        // Pareto Continuation Pages
        if (typeof continuationPareto !== 'undefined' && continuationPareto.length > 0) {
          const contRowHeight = 28;
          const maxRowsPerContPage = Math.floor(400 / contRowHeight); // ~14 rows
          const itemsPerContPagePareto = 4 * maxRowsPerContPage;
          for (let i = 0; i < continuationPareto.length; i += itemsPerContPagePareto) {
            const chunk = continuationPareto.slice(i, i + itemsPerContPagePareto);
            doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
            doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis (Continued)${renderConfig.suffix}`, { align: 'center' });
            doc.moveDown(1);
            
            const contStartY = doc.y;
            let contCols = Math.min(4, Math.ceil(chunk.length / maxRowsPerContPage));
            if (contCols < 1) contCols = 1;
            let contItemsPerCol = Math.ceil(chunk.length / contCols);
            let contChartHeight = Math.max(120, contItemsPerCol * contRowHeight);
            let contBoxHeight = Math.max(180, contChartHeight + 50);

            drawSectionBox(doc, 40, contStartY, 760, contBoxHeight, 'Observations by Parameter (Continued)');
            
            const startX = 50;
            const startY = contStartY + 35;
            const width = 740;
            const maxCount = Math.max(...paretoData.map(d => d.count), 1);
            const columnWidth = width / contCols;
            const maxLabelWidth = 115;
            const chartWidth = columnWidth - maxLabelWidth - 30;
            const bHeight = 8;
            
            doc.rect(startX + width / 2 - 40, startY - 20, 8, 8).fillColor('#1976d2').fill();
            doc.fillColor('#333333').fontSize(8).font('Helvetica').text('Observations', startX + width / 2 - 28, startY - 19);

            chunk.forEach((item, idx) => {
              const col = Math.floor(idx / contItemsPerCol);
              const row = idx % contItemsPerCol;
              const colStartX = startX + (col * columnWidth) + (col > 0 ? 10 : 0);
              const currentY = startY + (row * contRowHeight);
              const chartStartX = colStartX + maxLabelWidth + 5;
              
              doc.fillColor('#333333').fontSize(7.5).font('Helvetica').text(item.label, colStartX, currentY + (contRowHeight/2) - 10, { width: maxLabelWidth, align: 'left', lineBreak: true });
              const barW = (item.count / maxCount) * chartWidth;
              if (barW > 0) doc.rect(chartStartX, currentY + (contRowHeight/2) - (bHeight/2), barW, bHeight).fillColor('#1976d2').fill();
              doc.fillColor('#333333').fontSize(8).font('Helvetica').text(item.count.toString(), chartStartX + barW + 5, currentY + (contRowHeight/2) - 4);
            });
          }
        }

        // Treemap Page logic (Moved to be the last page)
        if (treemapData.length > 0) {
          doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
          doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis (Continued)${renderConfig.suffix}`, { align: 'center' });
          doc.moveDown(1);
          const contStartY = doc.y;
          drawSectionBox(doc, 40, contStartY, 760, 400, 'Observation Breakdown by Asset & Parameter');
          drawTreemap(doc, 50, contStartY + 30, 740, 360, treemapData);
        }

      } // End renderConfigs loop block

      // Calculate min/max chainage from tasks
      let minChainage = Number.MAX_VALUE;
      let maxChainage = -Number.MAX_VALUE;
      tasks.forEach(t => {
        const chVal = parseFloat(t.chainage);
        if (!isNaN(chVal)) {
          if (chVal < minChainage) minChainage = chVal;
          if (chVal > maxChainage) maxChainage = chVal;
        }
      });

      // Compute Chainage Buckets
      const buckets = [];
      const minC = Math.floor(minChainage);
      const maxC = Math.ceil(maxChainage) > minC ? Math.ceil(maxChainage) : minC + 1;

      const bucketMap = {};
      if (minChainage !== Number.MAX_VALUE && maxChainage !== -Number.MAX_VALUE) {
        for (let c = minC; c < maxC; c++) {
          const key = `${c}–${c + 1} km`;
          bucketMap[c] = { label: key, start: c, total: 0, critical: 0, audited: 0 };
        }
      }

      tasks.forEach(t => {
        const chVal = parseFloat(t.chainage);
        if (!isNaN(chVal)) {
          const c = Math.floor(chVal);
          if (bucketMap[c]) {
            bucketMap[c].audited++;

            let minScore = 10;
            if (t.ratings && t.ratings.length > 0) {
              minScore = Math.min(...t.ratings.map(r => Number(r.score) || 10));
            }
            if (minScore === 1 || minScore === 5) bucketMap[c].total++;
            if (minScore === 1) bucketMap[c].critical++;
          }
        }
      });

      Object.values(bucketMap).forEach(b => {
        buckets.push(b);
      });
      buckets.sort((a, b) => a.start - b.start);

      const tableHeaders = ['CHAINAGE RANGE', 'TOTAL OBSERVATIONS', 'CRITICAL OBSERVATIONS'];
      const colWidths = [200, 200, 200];
      const startX = 100;
      let p3StartY;

      const drawTableHeader = (yPos) => {
        let currentX = startX;
        doc.fillColor('#002b5c').fontSize(9).font('Helvetica-Bold');
        tableHeaders.forEach((h, i) => {
          doc.text(h, currentX, yPos, { width: colWidths[i], align: 'center' });
          currentX += colWidths[i];
        });
        doc.lineWidth(1).strokeColor('#002b5c').moveTo(startX, yPos + 15).lineTo(startX + 600, yPos + 15).stroke();
      };

      let rowsPerPage = 14;
      let curBucketIdx = 0;
      let chainagePageCount = 0;

      let maxTotal = -1, maxTotalBucket = '';
      let maxCrit = -1, maxCritBucket = '';

      while (curBucketIdx < buckets.length || curBucketIdx === 0) {
        doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
        doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Observation Analysis (Continued)${renderConfig.suffix}`, { align: 'center' });
        doc.moveDown(1);
        p3StartY = doc.y;

        const isLastPage = (curBucketIdx + rowsPerPage >= buckets.length);
        let rowsThisPage = isLastPage ? (buckets.length - curBucketIdx) : rowsPerPage;
        if (buckets.length === 0) rowsThisPage = 1;

        let sectionHeight = 420;
        let summaryY = p3StartY + 350;
        if (isLastPage) {
          let tableEndY = p3StartY + 55 + (rowsThisPage * 20) + 30; // Accommodate the TOTAL row
          summaryY = tableEndY + 10;
          if (summaryY < p3StartY + 100) summaryY = p3StartY + 100;
          sectionHeight = summaryY - p3StartY + 50 + 20;
        }

        drawSectionBox(doc, 40, p3StartY, 760, sectionHeight, 'Chainage-wise Observation Analysis' + (chainagePageCount > 0 ? ' (Continued)' : ''));

        let yPos = p3StartY + 30;
        drawTableHeader(yPos);
        yPos += 25;

        let rowCount = 0;
        while (curBucketIdx < buckets.length && rowCount < rowsPerPage) {
          const b = buckets[curBucketIdx];
          if (b.total > maxTotal) { maxTotal = b.total; maxTotalBucket = b.label; }
          if (b.critical > maxCrit) { maxCrit = b.critical; maxCritBucket = b.label; }

          doc.font('Helvetica').fontSize(9).fillColor('#333333');
          doc.text(b.label, startX, yPos, { width: colWidths[0], align: 'center' });

          doc.font(b.total > 0 ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(b.total.toString(), startX + colWidths[0], yPos, { width: colWidths[1], align: 'center' });

          doc.fillColor(b.critical > 0 ? '#d32f2f' : '#333333');
          doc.text(b.critical.toString(), startX + colWidths[0] + colWidths[1], yPos, { width: colWidths[2], align: 'center' });

          doc.lineWidth(0.5).strokeColor('#eeeeee').moveTo(startX, yPos + 12).lineTo(startX + 600, yPos + 12).stroke();

          yPos += 20;
          rowCount++;
          curBucketIdx++;
        }

        if (buckets.length === 0) {
          doc.fillColor('#666666').font('Helvetica').text('No chainage data available.', startX, yPos, { width: 600, align: 'center' });
          curBucketIdx++; // break loop
          yPos += 20;
        }

        if (isLastPage) {
          if (buckets.length > 0) {
            const grandTotal = buckets.reduce((sum, b) => sum + b.total, 0);
            const grandCritical = buckets.reduce((sum, b) => sum + b.critical, 0);
            doc.lineWidth(1).strokeColor('#002b5c').moveTo(startX, yPos).lineTo(startX + 600, yPos).stroke();
            yPos += 6;
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#002b5c');
            doc.text('TOTAL', startX, yPos, { width: colWidths[0], align: 'center' });
            doc.text(grandTotal.toString(), startX + colWidths[0], yPos, { width: colWidths[1], align: 'center' });
            doc.fillColor('#d32f2f').text(grandCritical.toString(), startX + colWidths[0] + colWidths[1], yPos, { width: colWidths[2], align: 'center' });
          }

          yPos = summaryY;
          doc.rect(startX, yPos, 600, 50).fillColor('#f8f9fa').fill();
          doc.lineWidth(1).strokeColor('#002b5c').rect(startX, yPos, 600, 50).stroke();
          doc.fillColor('#002b5c').fontSize(10).font('Helvetica-Bold').text('Chainage Summary', startX + 10, yPos + 10);
          doc.fillColor('#333333').fontSize(9).font('Helvetica');
          if (buckets.length > 0) {
            doc.text(`Highest total observation count: ${maxTotalBucket} (${maxTotal} total observations)`, startX + 10, yPos + 25);
            doc.text(`Highest critical observation count: ${maxCritBucket} (${maxCrit} critical observations)`, startX + 300, yPos + 25);
          } else {
            doc.text('No data to summarize.', startX + 10, yPos + 25);
          }

          // Draw Line Chart
          let chartData = buckets.map(b => ({ label: b.label, value: b.total }));
          // A4 Landscape height = 595.28, margin bottom = 40. Safe max Y = 555.
          let remainingSpace = 555 - (p3StartY + sectionHeight + 10);
          let chartBoxHeight = 220;

          if (remainingSpace >= chartBoxHeight) {
            // Render on same page
            let chartStartY = p3StartY + sectionHeight + 15;
            drawSectionBox(doc, 40, chartStartY, 760, chartBoxHeight, 'Chainage-wise Observations');
            drawLineChart(doc, 50, chartStartY + 30, 740, chartBoxHeight - 40, chartData);
          } else {
            // Next page
            doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
            doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text('Chainage-wise Observation Analysis (Continued)', { align: 'center' });
            doc.moveDown(1);
            let newChartStartY = doc.y;
            drawSectionBox(doc, 40, newChartStartY, 760, chartBoxHeight + 20, 'Chainage-wise Observations');
            drawLineChart(doc, 50, newChartStartY + 30, 740, chartBoxHeight - 20, chartData);
          }
        }
        chainagePageCount++;
      }

      // End of Chainage-wise Observation Analysis

      if (isSummary) {
        doc.end();
        return;
      }



      // --- PAGE 4: PARAMETER ANALYSIS (Landscape) ---
      doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'landscape' });
      doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text('Parameter Analysis', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor(textColor).font('Helvetica-Oblique');
      doc.text('Legend: [1 Rating]: Critical Issue (Requires immediate attention)   |   [5 Rating]: Minor Defect   |   [10 Rating]: Perfect Condition', { align: 'center' });
      doc.moveDown(1);

      const oldParamMap = {};
      tasks.forEach(t => {
        if (t.ratings && t.ratings.length > 0) {
          const firstR = t.ratings[0];
          const paramDoc = t.parameters && t.parameters.find(p => p && p._id && firstR.masterListId && p._id.toString() === firstR.masterListId.toString());
          const category = (paramDoc && paramDoc.category) || t.category || t.assetType || 'Unknown';
          const assetType = (paramDoc && paramDoc.assetType) || t.assetType || 'Unknown';

          const key = `${category}_${assetType}`;
          if (!oldParamMap[key]) {
            oldParamMap[key] = { c: category, a: assetType, audited: 0, observation: 0, c1: 0, c5: 0, c10: 0 };
          }
          oldParamMap[key].audited++;

          const hasObs = t.ratings.some(r => Number(r.score) === 1 || Number(r.score) === 5);
          if (hasObs) {
            oldParamMap[key].observation++;
          }

          let taskScore = 10;
          t.ratings.forEach(r => {
            const score = Number(r.score) || 0;
            if (score === 1) taskScore = 1;
            else if (score === 5 && taskScore !== 1) taskScore = 5;
          });

          if (taskScore === 1) oldParamMap[key].c1++;
          else if (taskScore === 5) oldParamMap[key].c5++;
          else oldParamMap[key].c10++;
        }
      });

      const paramRows = Object.values(oldParamMap).map(pm => {
        return {
          category: pm.c, assetType: pm.a,
          totalAudited: pm.audited, totalObservations: pm.observation,
          obsPct: pm.audited > 0 ? Math.round((pm.observation / pm.audited) * 100) + '%' : '0%',
          c1: pm.c1, c5: pm.c5, c10: pm.c10
        };
      });

      paramRows.sort((a, b) => b.totalObservations - a.totalObservations || b.totalAudited - a.totalAudited);

      let maxObsParam = -1;
      let minObsParam = 1000000;
      paramRows.forEach(pr => {
        const obs = pr.totalObservations || 0;
        if (obs > maxObsParam) maxObsParam = obs;
        if (obs < minObsParam) minObsParam = obs;
      });
      if (maxObsParam === 0 && minObsParam === 0) { maxObsParam = -1; minObsParam = -1; }

      const paramTable = {
        headers: [
          { label: "Category", width: 150 },
          { label: "Asset Type", width: 150 },
          { label: "Total Audited", width: 85 },
          { label: "Total Observations", width: 110 },
          { label: "% observation", width: 85 },
          { label: "1 Rating", width: 65 },
          { label: "5 rating", width: 65 },
          { label: "10 rating", width: 65 }
        ],
        rows: paramRows.map(pr => [
          pr.category, pr.assetType, pr.totalAudited.toString(), pr.totalObservations.toString(),
          pr.obsPct, pr.c1.toString(), pr.c5.toString(), pr.c10.toString()
        ])
      };

      await doc.table(paramTable, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          if (indexColumn === 0 && indexRow % 2 !== 0) {
            doc.addBackground(rectRow, altRowColor, 1);
          }
          doc.font("Helvetica").fontSize(9).fillColor(textColor);

          if (indexColumn === 3 && rectCell) {
            const obs = parseInt(row[3], 10);
            if (obs === maxObsParam && maxObsParam !== -1) {
              doc.addBackground(rectCell, '#FEE2E2', 1);
              doc.fillColor('#DC2626').font("Helvetica-Bold");
            } else if (obs === minObsParam && minObsParam !== -1) {
              doc.addBackground(rectCell, '#DCFCE7', 1);
              doc.fillColor('#16A34A').font("Helvetica-Bold");
            }
          }
        },
        divider: { header: { disabled: false, width: 1.5, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
      });

      // --- IMAGE EVIDENCE BY ASSET TYPE (Portrait) ---
      const evsByAsset = {};
      const auditedByAsset = {};

      tasks.forEach(t => {
        if (t.ratings && t.ratings.length > 0) {
          const firstR = t.ratings[0];
          const paramDoc = t.parameters && t.parameters.find(p => p && p._id && firstR.masterListId && p._id.toString() === firstR.masterListId.toString());
          const category = (paramDoc && paramDoc.category) || t.category || t.assetType || 'Unknown';
          const assetType = (paramDoc && paramDoc.assetType) || t.assetType || 'Unknown';

          auditedByAsset[assetType] = (auditedByAsset[assetType] || 0) + 1;

          const badRatings = t.ratings.filter(r => Number(r.score) === 1 || Number(r.score) === 5);
          badRatings.forEach(badRating => {
            if (!evsByAsset[assetType]) evsByAsset[assetType] = [];

            const badParamDoc = t.parameters && t.parameters.find(p => p && p._id && badRating.masterListId && p._id.toString() === badRating.masterListId.toString());
            const badParameter = (badParamDoc && badParamDoc.parameter) || badRating.parameterName || badRating.parameterKey || 'Unknown';

            evsByAsset[assetType].push({
              chainage: t.chainage,
              category: category,
              assetType: assetType,
              parameter: badParameter,
              score: Number(badRating.score) || 0,
              remark: this.normalizeRemark(badRating.remark),
              direction: (badParamDoc && badParamDoc.direction) || t.direction || '-',
              ratedAt: new Date(t.updatedAt || t.createdAt).toLocaleString(),
              imageUrl: badRating.imageUrl || (t.image && t.image.cloudinaryUrl) || null
            });
          });
        }
      });

      const globalRemarkCounts = {};
      for (const [assetType, evs] of Object.entries(evsByAsset)) {
        const uniqueChainagesMap = {};
        evs.forEach(e => {
          const c = (e.chainage != null && !isNaN(e.chainage) ? parseFloat(e.chainage).toFixed(2) : (e.chainage?.toString() || '-'));
          if (!uniqueChainagesMap[c]) uniqueChainagesMap[c] = e;
        });
        Object.values(uniqueChainagesMap).forEach(e => {
          const r = e.remark || 'Unknown';
          globalRemarkCounts[r] = (globalRemarkCounts[r] || 0) + 1;
        });
      }

      const remarkRows = Object.entries(globalRemarkCounts)
        .map(([remark, count]) => [remark, count.toString()])
        .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));

      if (remarkRows.length > 0) {
        doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'portrait' });
        doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text("Overall Remark Summary", { align: 'center' });
        doc.moveDown(1);

        const CHUNK_SIZE = 500;
        for (let i = 0; i < remarkRows.length; i += CHUNK_SIZE) {
          const chunkRows = remarkRows.slice(i, i + CHUNK_SIZE);
          const remarkTable = {
            headers: [
              { label: "Remark", width: 400 },
              { label: "Count", width: 115 }
            ],
            rows: chunkRows
          };

          await doc.table(remarkTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor),
            prepareRow: (row, indexColumn, indexRow, rectRow) => {
              if (indexColumn === 0 && indexRow % 2 !== 0) {
                doc.addBackground(rectRow, altRowColor, 1);
              }
              doc.font("Helvetica").fontSize(10).fillColor(textColor);
            },
            divider: { header: { disabled: false, width: 1.5, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
          });

          // Yield to event loop to prevent MongoDB disconnects
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      for (const [assetType, evs] of Object.entries(evsByAsset)) {
        evs.sort((a, b) => a.score - b.score);

        const uniqueChainagesMap = {};
        evs.forEach(e => {
          const c = (e.chainage != null && !isNaN(e.chainage) ? parseFloat(e.chainage).toFixed(2) : (e.chainage?.toString() || '-'));
          if (!uniqueChainagesMap[c]) uniqueChainagesMap[c] = e;
        });
        const uniqueEvs = Object.values(uniqueChainagesMap);

        if (uniqueEvs.length === 0) continue;

        // --- 1. DEDICATED SUMMARY TABLE PAGE(S) ---
        doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'portrait' });
        doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(assetType, { align: 'center' });
        doc.moveDown(0.5);

        const totalAudited = auditedByAsset[assetType] || 0;
        const totalObservations = uniqueEvs.length;
        const obsPct = totalAudited > 0 ? Math.round((totalObservations / totalAudited) * 100) + '%' : '0%';
        doc.fontSize(12).text(`Total Audited: ${totalAudited}   |   Total Observations: ${totalObservations}   |   % observation: ${obsPct}`, { align: 'center' });
        doc.moveDown(1);

        const CHUNK_SIZE = 500;
        for (let i = 0; i < uniqueEvs.length; i += CHUNK_SIZE) {
          const chunkEvs = uniqueEvs.slice(i, i + CHUNK_SIZE);
          const obsTable = {
            headers: [
              { label: "Chainage", width: 120 },
              { label: "Direction", width: 80 },
              { label: "Rate (1/5)", width: 80 },
              { label: "Remark", width: 235 }
            ],
            rows: chunkEvs.map(e => [(e.chainage != null && !isNaN(e.chainage) ? parseFloat(e.chainage).toFixed(2) : (e.chainage?.toString() || '-')), e.direction || '-', e.score?.toString() || '-', e.remark || '-'])
          };

          await doc.table(obsTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor),
            prepareRow: (row, indexColumn, indexRow, rectRow) => {
              if (indexColumn === 0 && indexRow % 2 !== 0) {
                doc.addBackground(rectRow, altRowColor, 1);
              }
              doc.font("Helvetica").fontSize(10).fillColor(textColor);
            },
            divider: { header: { disabled: false, width: 1.5, opacity: 1, color: primaryColor }, horizontal: { disabled: false, width: 0.5, opacity: 1, color: borderColor } }
          });

          // Yield to event loop to prevent MongoDB disconnects
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        // --- 2. IMAGE PAGES ---
        const evsWithImages = uniqueEvs.filter(ev => ev.imageUrl);

        // Process in chunks of 6
        for (let chunkStart = 0; chunkStart < evsWithImages.length; chunkStart += 6) {
          const chunk = evsWithImages.slice(chunkStart, chunkStart + 6);

          // Fetch buffers concurrently to save time
          const imageBuffers = await Promise.all(chunk.map(async ev => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              const res = await fetch(ev.imageUrl, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) {
                const arr = await res.arrayBuffer();
                return Buffer.from(arr);
              }
            } catch (e) {
              console.error("PDF Image Fetch Error:", e.message);
            }
            return null;
          }));

          doc.addPage({ margins: PAGE_MARGINS, size: 'A4', layout: 'portrait' });
          if (chunkStart === 0) {
            doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`${assetType} - Images`, { align: 'center' });
          } else {
            doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`${assetType} (Continued)`, { align: 'center' });
          }
          doc.moveDown(1);

          const startY = doc.y;
          let col = 0;
          let rowIdx = 0;
          const cellWidth = 248;
          const colGap = 35;
          const rowGap = 20;
          const imgHeight = 155;

          for (let i = 0; i < chunk.length; i++) {
            const ev = chunk[i];
            const imgBuffer = imageBuffers[i];

            const x = 40 + (col * (cellWidth + colGap));
            const y = startY + (rowIdx * (imgHeight + 40 + rowGap));

            if (imgBuffer) {
              try {
                doc.image(imgBuffer, x, y, { fit: [cellWidth, imgHeight] });
              } catch (e) {
                console.error("Failed to render image in PDF:", e);
              }
            } else {
              doc.save();
              doc.rect(x, y, cellWidth, imgHeight).stroke(borderColor);
              doc.fontSize(12).fillColor(borderColor).text("No Image Provided", x, y + (imgHeight / 2) - 6, { width: cellWidth, align: 'center' });
              doc.restore();
            }

            const tableY = y + imgHeight + 5;

            // Draw mini table manually
            doc.save();
            const th = 10;
            const row2h = 20;

            doc.rect(x, tableY, cellWidth, th).fill('#E5E7EB');
            doc.fontSize(5).font('Helvetica-Bold').fillColor(primaryColor);

            const cw = [28, 38, 28, 40, 18, 38, 20, 38];
            let curX = x;
            const headers = ['Chainage', 'Category', 'Asset', 'Parameter', 'Rate', 'Remark', 'Dir', 'Date of Audit'];
            for (let j = 0; j < 8; j++) {
              doc.text(headers[j], curX + 1, tableY + 2, { width: cw[j] - 2 });
              curX += cw[j];
            }

            doc.fontSize(5).font('Helvetica').fillColor(textColor);
            curX = x;
            const vals = [
              (ev.chainage != null && !isNaN(ev.chainage) ? parseFloat(ev.chainage).toFixed(2) : (ev.chainage?.toString() || '-')),
              ev.category,
              ev.assetType,
              ev.parameter || '-',
              ev.score?.toString() || '-',
              ev.remark || '-',
              ev.direction || '-',
              new Date(ev.ratedAt).toLocaleDateString()
            ];
            for (let j = 0; j < 8; j++) {
              doc.text(vals[j], curX + 1, tableY + th + 2, { width: cw[j] - 2, height: row2h - 2 });
              curX += cw[j];
            }


            // Borders
            doc.rect(x, tableY, cellWidth, th + row2h).stroke(borderColor);
            doc.moveTo(x, tableY + th).lineTo(x + cellWidth, tableY + th).stroke(borderColor);

            curX = x;
            for (let j = 0; j < 6; j++) {
              curX += cw[j];
              doc.moveTo(curX, tableY).lineTo(curX, tableY + th + row2h).stroke(borderColor);
            }
            doc.restore();

            col++;
            if (col > 1) {
              col = 0;
              rowIdx++;
            }
          }
        }
      }

      doc.end();
    }

  async generateComparisonPdfReport(project, versionA, versionB, res, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const analyticsService = require('../analytics/analytics.service');

    // 1. Resolve versionA and versionB names
    const batches = await InspectionBatch.find({ project }).sort({ createdAt: -1 }).lean();
    if (batches.length < 2) {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      doc.on('error', err => console.error('PDF Document Error:', err));
      doc.pipe(res);
      doc.font('Helvetica-Bold').fontSize(16).text('Comparison data is not available for the selected inspection cycles (Need at least 2 cycles).', 40, 100);
      doc.end();
      return;
    }

    let vAName = versionA;
    let vBName = versionB;

    if (!versionA || !versionB || versionA === 'all' || versionB === 'all') {
      versionB = batches[0]._id.toString();
      vBName = batches[0].name;
      versionA = batches[1]._id.toString();
      vAName = batches[1].name;
    } else {
      const batchA = batches.find(b => b._id.toString() === versionA);
      const batchB = batches.find(b => b._id.toString() === versionB);
      if (batchA) vAName = batchA.name;
      if (batchB) vBName = batchB.name;
    }

    const projDoc = await Project.findOne({ code: project }).lean();
    const projName = projDoc ? (projDoc.fullName || projDoc.name) : project;

    // 2. Fetch Comparison Data
    const data = await analyticsService.getComparisonData(project, versionA, versionB, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction);
    const { metrics, assetPerformances, categoryPerformances, topDeteriorated, topImproved, criticalActionItems, criticalIssues } = data;

    // 3. Setup PDF Document
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 60, bottom: 50, left: 40, right: 40 }, bufferPages: true });
    doc.on('error', err => console.error('PDF Document Error:', err));
    doc.pipe(res);

    const primaryThemeColor = '#1e3a8a';

    doc.fillColor(primaryThemeColor).font('Helvetica-Bold').fontSize(24).text('INSPECTION COMPARISON SUMMARY REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#4b5563').font('Helvetica').fontSize(12).text(`Project: ${projName}`, { align: 'center' });
    doc.text(`Previous Cycle: ${vAName} | Current Cycle: ${vBName}`, { align: 'center' });
    doc.text(`Report Generated On: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const kpiY = doc.y;
    const kpiWidth = 100;
    const kpiHeight = 60;
    const kpiSpacing = 10;
    const totalWidth = 7 * kpiWidth + 6 * kpiSpacing;
    const startX = (doc.page.width - totalWidth) / 2;

    const drawKpi = (x, y, title, value, bgColor, textColor) => {
      doc.fillColor(bgColor).rect(x, y, kpiWidth, kpiHeight).fill();
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(18).text(value.toString(), x, y + 15, { width: kpiWidth, align: 'center' });
      doc.font('Helvetica').fontSize(10).text(title, x, y + 40, { width: kpiWidth, align: 'center' });
    };

    drawKpi(startX, kpiY, 'Total Compared', metrics.totalCompared, '#f3f4f6', '#111827');
    drawKpi(startX + (kpiWidth + kpiSpacing) * 1, kpiY, 'Improved', metrics.improved, '#dcfce7', '#166534');
    drawKpi(startX + (kpiWidth + kpiSpacing) * 2, kpiY, 'Deteriorated', metrics.deteriorated, '#fee2e2', '#991b1b');
    drawKpi(startX + (kpiWidth + kpiSpacing) * 3, kpiY, 'Critical Observations', metrics.criticalIssues, '#fef9c3', '#854d0e');
    drawKpi(startX + (kpiWidth + kpiSpacing) * 4, kpiY, 'Avg Prev Rating', metrics.avgPreviousRating, '#dbeafe', '#1e40af');
    drawKpi(startX + (kpiWidth + kpiSpacing) * 5, kpiY, 'Avg Curr Rating', metrics.avgCurrentRating, '#e0e7ff', '#3730a3');
    drawKpi(startX + (kpiWidth + kpiSpacing) * 6, kpiY, 'Net Change', metrics.netChange > 0 ? `+${metrics.netChange}` : metrics.netChange, '#f3e8ff', '#6b21a8');

    doc.y = kpiY + kpiHeight + 30;

    doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryThemeColor).text('Executive Insight');
    doc.moveDown(0.5);

    let insight = "Overall inspection condition remains stable compared with the previous inspection cycle.";
    if (metrics.improved > metrics.deteriorated) {
      if (metrics.criticalIssues > 0) {
        insight = "Overall condition has improved; however, critical observations requiring attention were identified.";
      } else {
        insight = "Overall inspection condition has improved compared with the previous inspection cycle.";
      }
    } else if (metrics.deteriorated > metrics.improved) {
      insight = "Overall inspection condition has deteriorated compared with the previous inspection cycle.";
    }

    doc.font('Helvetica').fontSize(12).fillColor('#111827').text(insight);
    doc.moveDown(2);

    const chartY = doc.y;

    doc.font('Helvetica-Bold').fontSize(12).text('Improvement vs Deterioration', 40, chartY);
    const barMaxW = 200;
    const impW = metrics.totalCompared ? (metrics.improved / metrics.totalCompared) * barMaxW : 0;
    const detW = metrics.totalCompared ? (metrics.deteriorated / metrics.totalCompared) * barMaxW : 0;

    doc.rect(40, chartY + 20, impW, 20).fill('#22c55e');
    doc.fillColor('#111827').font('Helvetica').fontSize(10).text(`Improved: ${metrics.improved}`, 40 + impW + 10, chartY + 25);

    doc.rect(40, chartY + 50, detW, 20).fill('#ef4444');
    doc.fillColor('#111827').font('Helvetica').text(`Deteriorated: ${metrics.deteriorated}`, 40 + detW + 10, chartY + 55);

    const chart2X = 400;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Average Rating Comparison', chart2X, chartY);

    const ratingMaxW = 200;
    const pRatW = (parseFloat(metrics.avgPreviousRating) / 10) * ratingMaxW || 0;
    const cRatW = (parseFloat(metrics.avgCurrentRating) / 10) * ratingMaxW || 0;
    const cRatColor = parseFloat(metrics.avgCurrentRating) >= parseFloat(metrics.avgPreviousRating) ? '#22c55e' : '#ef4444';

    doc.rect(chart2X, chartY + 20, pRatW, 20).fill('#94a3b8');
    doc.fillColor('#111827').font('Helvetica').text(`Previous: ${metrics.avgPreviousRating}`, chart2X + pRatW + 10, chartY + 25);

    doc.rect(chart2X, chartY + 50, cRatW, 20).fill(cRatColor);
    doc.fillColor('#111827').font('Helvetica').text(`Current: ${metrics.avgCurrentRating}`, chart2X + cRatW + 10, chartY + 55);

    doc.addPage();

    const renderTable = async (title, headers, rows) => {
      if (rows.length === 0) return;
      if (doc.y > 60) doc.moveDown(2);

      doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryThemeColor).text(title);
      doc.moveDown(0.5);

      const tableData = {
        headers: headers.map(h => ({ label: h.label, property: h.property, width: h.width, renderer: null })),
        datas: rows
      };

      await doc.table(tableData, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow) => {
          doc.font("Helvetica").fontSize(9);
        },
        padding: 5,
        columnSpacing: 5
      });
    };

    await renderTable('Asset Type Performance Comparison', [
      { label: 'Asset Type', property: 'assetType', width: 250 },
      { label: 'Previous Average Rating', property: 'prevRating', width: 150 },
      { label: 'Current Average Rating', property: 'currRating', width: 150 },
      { label: 'Rating Change', property: 'change', width: 150 }
    ], assetPerformances.map(a => ({ ...a, change: parseFloat(a.change) > 0 ? `+${a.change}` : a.change })));

    await renderTable('Category Performance Summary', [
      { label: 'Category', property: 'category', width: 250 },
      { label: 'Previous Average Rating', property: 'prevRating', width: 150 },
      { label: 'Current Average Rating', property: 'currRating', width: 150 },
      { label: 'Rating Change', property: 'change', width: 150 }
    ], categoryPerformances.map(a => ({ ...a, change: parseFloat(a.change) > 0 ? `+${a.change}` : a.change })));

    const deterioratedRows = topDeteriorated.map(d => ({
      chainage: d.chainage, category: d.category, asset: d.asset, parameter: d.parameter,
      prevRating: d.prevRating.toString(), currRating: d.currRating.toString(), change: d.change.toString(), status: d.status
    }));
    await renderTable('Top Deteriorated Issues', [
      { label: 'Chainage', property: 'chainage', width: 70 },
      { label: 'Category', property: 'category', width: 120 },
      { label: 'Asset', property: 'asset', width: 150 },
      { label: 'Parameter', property: 'parameter', width: 200 },
      { label: 'Prev Rating', property: 'prevRating', width: 50 },
      { label: 'Curr Rating', property: 'currRating', width: 50 },
      { label: 'Change', property: 'change', width: 50 },
      { label: 'Status', property: 'status', width: 70 }
    ], deterioratedRows);

    const improvedRows = topImproved.map(d => ({
      chainage: d.chainage, category: d.category, asset: d.asset, parameter: d.parameter,
      prevRating: d.prevRating.toString(), currRating: d.currRating.toString(), change: d.change > 0 ? `+${d.change}` : d.change.toString(), status: d.status
    }));
    await renderTable('Top Improved Items', [
      { label: 'Chainage', property: 'chainage', width: 70 },
      { label: 'Category', property: 'category', width: 120 },
      { label: 'Asset', property: 'asset', width: 150 },
      { label: 'Parameter', property: 'parameter', width: 200 },
      { label: 'Prev Rating', property: 'prevRating', width: 50 },
      { label: 'Curr Rating', property: 'currRating', width: 50 },
      { label: 'Change', property: 'change', width: 50 },
      { label: 'Status', property: 'status', width: 70 }
    ], improvedRows);

    const criticalRows = criticalActionItems.map(d => ({
      chainage: d.chainage, category: d.category, asset: d.asset, parameter: d.parameter,
      currRating: d.currRating.toString(), prevRating: d.prevRating.toString(), change: d.change > 0 ? `+${d.change}` : d.change.toString(), currRemark: d.currRemark || '-'
    }));
    await renderTable('Critical Observations Requiring Immediate Attention', [
      { label: 'Chainage', property: 'chainage', width: 70 },
      { label: 'Category', property: 'category', width: 120 },
      { label: 'Asset', property: 'asset', width: 130 },
      { label: 'Parameter', property: 'parameter', width: 150 },
      { label: 'Curr Rating', property: 'currRating', width: 50 },
      { label: 'Prev Rating', property: 'prevRating', width: 50 },
      { label: 'Change', property: 'change', width: 50 },
      { label: 'Current Remark', property: 'currRemark', width: 140 }
    ], criticalRows);

    if (criticalIssues.length > 0) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryThemeColor).text('Detailed Image Comparison Records');
      doc.moveDown();

      for (let i = 0; i < criticalIssues.length; i++) {
        const issue = criticalIssues[i];
        if (doc.y > doc.page.height - 270) doc.addPage();
        const blockY = doc.y;

        doc.rect(40, blockY, doc.page.width - 80, 20).fill('#f3f4f6');
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);
        doc.text(`${issue.chainage} | ${issue.category} | ${issue.assetType} | ${issue.parameter}`, 45, blockY + 5);

        const imgWidth = 240;
        const imgHeight = 140;
        const prevX = 40;
        const currX = doc.page.width / 2 + 10;

        doc.font('Helvetica-Bold').fontSize(10).text('Previous Inspection', prevX, blockY + 25);
        try {
          if (issue.prevImage) {
            const resp = await fetch(issue.prevImage);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              doc.image(Buffer.from(arrayBuffer), prevX, blockY + 40, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight] });
            } else { throw new Error(); }
          } else {
            doc.rect(prevX, blockY + 40, imgWidth, imgHeight).stroke('#d1d5db');
            doc.font('Helvetica').text('No Image Available', prevX + 70, blockY + 40 + 70);
          }
        } catch (e) {
          doc.rect(prevX, blockY + 40, imgWidth, imgHeight).stroke('#d1d5db');
          doc.font('Helvetica').text('Image Load Error', prevX + 70, blockY + 40 + 70);
        }
        doc.font('Helvetica').fontSize(9).text(`Rating: ${issue.prevRating}`, prevX, blockY + 40 + imgHeight + 5, { width: imgWidth });
        doc.text(`Remark: ${issue.prevRemark || '-'}`, prevX, blockY + 40 + imgHeight + 15, { width: imgWidth });

        doc.font('Helvetica-Bold').fontSize(10).text('Current Inspection', currX, blockY + 25);
        try {
          if (issue.currImage) {
            const resp = await fetch(issue.currImage);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              doc.image(Buffer.from(arrayBuffer), currX, blockY + 40, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight] });
            } else { throw new Error(); }
          } else {
            doc.rect(currX, blockY + 40, imgWidth, imgHeight).stroke('#d1d5db');
            doc.font('Helvetica').text('No Image Available', currX + 70, blockY + 40 + 70);
          }
        } catch (e) {
          doc.rect(currX, blockY + 40, imgWidth, imgHeight).stroke('#d1d5db');
          doc.font('Helvetica').text('Image Load Error', currX + 70, blockY + 40 + 70);
        }
        doc.font('Helvetica').fontSize(9).text(`Rating: ${issue.currRating}`, currX, blockY + 40 + imgHeight + 5, { width: imgWidth });
        doc.text(`Remark: ${issue.currRemark || '-'}`, currX, blockY + 40 + imgHeight + 15, { width: imgWidth });

        const statColor = issue.change > 0 ? '#166534' : (issue.change < 0 ? '#991b1b' : '#374151');
        doc.font('Helvetica-Bold').fontSize(12).fillColor(statColor).text(issue.status.toUpperCase(), doc.page.width / 2 - 40, blockY + 40 + imgHeight / 2);

        doc.y = blockY + 40 + imgHeight + 50;
      }
    }

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(`Page ${i + 1} of ${pages.count}`, doc.page.margins.left, doc.page.height - 30, { align: 'center' });
    }

    doc.end();
  }

  async getStripChartData(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction) {
    const tasks = await this.getTasksForReport(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
    const allRatings = this.flattenRatingsForAnalysis(tasks);

    // Bucket configuration
    const rowsSet = new Set();
    const colsSet = new Set();
    const directionsMap = {};

    allRatings.forEach(r => {
      // Calculate 1km bucket (Row)
      const start = Math.floor(r.chainage);
      const end = start + 1;
      const bucketStr = `${start}-${end}`;
      rowsSet.add(bucketStr);

      // Calculate Rating Completed Length in meters (Column)
      const lengthMeters = Math.round((r.chainage - start) * 1000);
      let interval = Math.ceil(lengthMeters / 100) * 100;
      if (interval === 0) interval = 100; // 0m falls into the 100m bucket

      const colStr = interval.toString();
      colsSet.add(interval);

      const dir = (r.direction && r.direction !== '-') ? r.direction : 'Other';

      if (!directionsMap[dir]) {
        directionsMap[dir] = {};
      }
      if (!directionsMap[dir][bucketStr]) {
        directionsMap[dir][bucketStr] = {};
      }
      if (!directionsMap[dir][bucketStr][colStr]) {
        directionsMap[dir][bucketStr][colStr] = { status: 'Good', issues: 0, good: 0, parameterCounts: {}, assetTypes: [], issuesList: [], seenAssetChainages: new Set() };
      }

      const cell = directionsMap[dir][bucketStr][colStr];
      const asset = r.assetType || 'Unknown';
      if (!cell.assetTypes.includes(asset)) {
        cell.assetTypes.push(asset);
      }

      if (r.score === 1 || r.score === 5) {
        const uniqueKey = `${dir}_${asset}_${r.chainage}`;
        if (!cell.seenAssetChainages.has(uniqueKey)) {
          cell.seenAssetChainages.add(uniqueKey);
          cell.issues++;
        }

        cell.status = 'Issue';

        if (r.parameter) {
          cell.parameterCounts[r.parameter] = (cell.parameterCounts[r.parameter] || 0) + 1;
        }

        cell.issuesList.push({
          assetType: asset,
          parameter: r.parameter || '-',
          chainage: r.chainage,
          imageUrl: r.imageUrl
        });
      } else {
        cell.good++;
      }
    });

    // Cleanup sets before returning to avoid serialisation issues
    Object.values(directionsMap).forEach(dirObj => {
      Object.values(dirObj).forEach(bucketObj => {
        Object.values(bucketObj).forEach(cell => {
          delete cell.seenAssetChainages;
        });
      });
    });

    const sortedRows = Array.from(rowsSet).sort((a, b) => parseFloat(a.split('-')[0]) - parseFloat(b.split('-')[0]));

    // Generate all 100m intervals up to the maximum observed
    const maxInterval = colsSet.size > 0 ? Math.max(...Array.from(colsSet)) : 1000;
    const sortedCols = [];
    for (let i = 100; i <= maxInterval; i += 100) {
      sortedCols.push(i.toString());
    }

    return {
      rows: sortedRows,
      cols: sortedCols,
      data: directionsMap
    };
  }
  async getOverviewStripChartData(project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction) {
    const tasksA = await this.getTasksForReport(project, previousCycle, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
    const tasksB = await this.getTasksForReport(project, currentCycle, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);

    const ratingsA = this.flattenRatingsForAnalysis(tasksA);
    const ratingsB = this.flattenRatingsForAnalysis(tasksB);

    // Group by 500m buckets, then by Direction
    const bucketsMap = {}; // direction -> bucketStr -> { prev: {}, curr: {} }

    const processRatings = (ratings, cycleKey) => {
      ratings.forEach(r => {
        if (r.score !== 1 && r.score !== 5) return; // Only count issues

        const dir = (r.direction && r.direction !== "-") ? r.direction : "Other";

        // Calculate 500m bucket
        const start = Math.floor(r.chainage * 2) / 2;
        const end = start + 0.5;
        const bucketStr = `${start.toFixed(1)}-${end.toFixed(1)}`;

        if (!bucketsMap[dir]) bucketsMap[dir] = {};
        if (!bucketsMap[dir][bucketStr]) bucketsMap[dir][bucketStr] = { prev: {}, curr: {} };

        const target = bucketsMap[dir][bucketStr][cycleKey];

        // Issue key based on unique Asset + Exact Chainage
        const issueKey = `${r.assetType}_${r.chainage}`;

        if (!target[issueKey]) {
          target[issueKey] = {
            assetType: r.assetType,
            chainage: r.chainage,
            minScore: r.score,
            imageUrl: r.imageUrl,
            parameters: []
          };
        }

        if (r.score < target[issueKey].minScore) {
          target[issueKey].minScore = r.score;
        }

        if (r.parameter && !target[issueKey].parameters.includes(r.parameter)) {
          target[issueKey].parameters.push(r.parameter);
        }
      });
    };

    processRatings(ratingsA, "prev");
    processRatings(ratingsB, "curr");

    // Build the final structure
    const directionsMap = {};
    const rowsSet = new Set();

    Object.keys(bucketsMap).forEach(dir => {
      directionsMap[dir] = {};

      Object.keys(bucketsMap[dir]).forEach(bucketStr => {
        rowsSet.add(bucketStr);

        const prevIssuesMap = bucketsMap[dir][bucketStr].prev;
        const currIssuesMap = bucketsMap[dir][bucketStr].curr;

        const prevKeys = Object.keys(prevIssuesMap);
        const currKeys = Object.keys(currIssuesMap);

        const prevCount = prevKeys.length;
        const currCount = currKeys.length;

        let resolvedCount = 0;
        let persistentCount = 0;
        let newCount = 0;

        currKeys.forEach(k => {
          if (prevIssuesMap[k]) persistentCount++;
          else newCount++;
        });

        prevKeys.forEach(k => {
          if (!currIssuesMap[k]) resolvedCount++;
        });

        let status = "Green";
        if (prevCount > 0 && persistentCount > 0) {
          status = "Red";
        }

        // Compile parameter list for tooltip
        const prevIssuesList = Object.values(prevIssuesMap);
        const currIssuesList = Object.values(currIssuesMap);

        directionsMap[dir][bucketStr] = {
          status,
          prevCount,
          currCount, // Total current issues (for tooltip if needed)
          resolvedCount,
          persistentCount, // Carried forward issues
          newCount, // New current issues (for tooltip)
          prevIssuesList,
          currIssuesList
        };
      });
    });

    // Sort rows (buckets)
    const sortedRows = Array.from(rowsSet).sort((a, b) => {
      const aStart = parseFloat(a.split("-")[0]);
      const bStart = parseFloat(b.split("-")[0]);
      return aStart - bStart;
    });

    return {
      rows: sortedRows,
      data: directionsMap
    };
  }
}

module.exports = new ReportService();

