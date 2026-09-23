'use strict';

const reportService = require('../report.service');
const InspectionBatch = require('../../../models/InspectionBatch.model');
const Project = require('../../../models/Project.model');

class PerformanceCenterService {

  /**
   * Main orchestrator: computes all 9 sections of the Performance Center
   * from a single dataset fetch (reuses getTasksForReport from ReportService).
   */
  async getPerformanceCenterData(project, cycleId, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction) {
    // 1. Fetch tasks using existing infrastructure (single DB query)
    const tasks = await reportService.getTasksForReport(
      project, cycleId, chainageType, chainageFrom, chainageTo,
      selectedAssetType, selectedParameter, roadType, direction
    );

    // 2. Flatten ratings using existing utility
    const allRatings = reportService.flattenRatingsForAnalysis(tasks);

    // 3. Fetch project details
    const projectDoc = await Project.findOne({ code: project }).lean();
    
    // 4. Fetch batch details if a specific cycle is selected
    let batchDoc = null;
    if (cycleId && cycleId !== 'all') {
      batchDoc = await InspectionBatch.findById(cycleId).lean();
    }

    // 5. Compute all sections from the same dataset
    const overview = this.computeOverview(tasks, allRatings, projectDoc, batchDoc, project);
    const condition = this.computeConditionProfile(allRatings);
    const assetPerformance = this.computeAssetPerformance(allRatings);
    const issueIntelligence = this.computeIssueIntelligence(allRatings);
    const risk = this.computeRiskCriticality(allRatings);
    const hotspots = this.computeChainageIntelligence(allRatings);
    const coverage = this.computeInspectionCoverage(tasks, allRatings);
    const evidence = this.computeEvidence(allRatings);
    const managementSummary = this.computeManagementSummary(overview, condition, issueIntelligence, risk, hotspots, coverage);

    return {
      overview,
      condition,
      assetPerformance,
      issueIntelligence,
      risk,
      hotspots,
      coverage,
      evidence,
      managementSummary,
      metadata: {
        project,
        cycleId: cycleId || 'all',
        cycleName: batchDoc ? batchDoc.name : 'All Cycles',
        roadType: roadType || 'Both',
        direction: direction || 'Both',
        chainageType: chainageType || 'all',
        chainageFrom: chainageFrom || null,
        chainageTo: chainageTo || null,
        assetType: selectedAssetType || 'all',
        parameter: selectedParameter || 'all',
        generatedAt: new Date().toISOString(),
        totalRecordsAnalyzed: allRatings.length,
        dataSource: 'HiRATE Inspection Database'
      }
    };
  }

  // ─── SECTION 1: OVERVIEW ────────────────────────────────────────────────────

  computeOverview(tasks, allRatings, projectDoc, batchDoc, projectCode) {
    const totalTasks = tasks.length;
    const ratedTasks = tasks.filter(t => t.ratings && t.ratings.length > 0).length;
    const totalRatings = allRatings.length;

    // Average rating
    let sumScore = 0;
    let criticalCount = 0;
    allRatings.forEach(r => {
      sumScore += r.score;
      if (r.score === 1) criticalCount++;
    });
    const avgRating = totalRatings > 0 ? (sumScore / totalRatings).toFixed(2) : 'N/A';

    // Unique chainages
    const chainageSet = new Set();
    allRatings.forEach(r => {
      const ch = typeof r.chainage === 'number' ? r.chainage : parseFloat(r.chainage);
      if (!isNaN(ch)) chainageSet.add(ch.toFixed(2));
    });

    // Image coverage
    let withImage = 0;
    let withoutImage = 0;
    tasks.forEach(t => {
      if (t.image && t.image.cloudinaryUrl) {
        withImage++;
      } else {
        withoutImage++;
      }
    });
    const imageCoverage = totalTasks > 0 ? ((withImage / totalTasks) * 100).toFixed(1) : 'N/A';

    // Date range
    let minDate = null;
    let maxDate = null;
    tasks.forEach(t => {
      const d = t.updatedAt || t.createdAt;
      if (d) {
        const dt = new Date(d);
        if (!minDate || dt < minDate) minDate = dt;
        if (!maxDate || dt > maxDate) maxDate = dt;
      }
    });

    let inspectionDateRange = 'N/A';
    if (minDate && maxDate) {
      const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      inspectionDateRange = fmt(minDate) === fmt(maxDate) ? fmt(minDate) : `${fmt(minDate)} – ${fmt(maxDate)}`;
    }

    // Project display name
    let displayProjectName = projectDoc ? (projectDoc.fullName || projectDoc.code) : projectCode;

    return {
      projectName: displayProjectName,
      projectCode: projectCode,
      highway: projectDoc?.highway || null,
      state: projectDoc?.state || null,
      client: projectDoc?.client || null,
      cycleName: batchDoc ? batchDoc.name : 'All Cycles',
      cycleDate: batchDoc ? new Date(batchDoc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      totalAssets: totalTasks,
      ratedAssets: ratedTasks,
      totalRatings,
      averageRating: avgRating,
      criticalIssues: criticalCount,
      uniqueChainages: chainageSet.size,
      imageCoverage: imageCoverage,
      imagesAvailable: withImage,
      imagesMissing: withoutImage,
      inspectionDateRange,
      totalLength: projectDoc?.totalLength || null
    };
  }

  // ─── SECTION 2: CONDITION PROFILE ───────────────────────────────────────────

  computeConditionProfile(allRatings) {
    // Based on existing score system: 10 = Good, 5 = Moderate/Observation, 1 = Critical
    let good = 0;
    let moderate = 0;
    let critical = 0;
    const totalRatings = allRatings.length;

    allRatings.forEach(r => {
      if (r.score === 10) good++;
      else if (r.score === 5) moderate++;
      else if (r.score === 1) critical++;
      else {
        // Handle any unexpected scores
        if (r.score >= 8) good++;
        else if (r.score >= 3) moderate++;
        else critical++;
      }
    });

    const avgRating = totalRatings > 0 ? (allRatings.reduce((s, r) => s + r.score, 0) / totalRatings).toFixed(2) : 'N/A';

    // Rating distribution histogram
    const distribution = {};
    allRatings.forEach(r => {
      const key = r.score;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return {
      averageRating: avgRating,
      totalRatings,
      good: { count: good, percentage: totalRatings > 0 ? ((good / totalRatings) * 100).toFixed(1) : '0' },
      moderate: { count: moderate, percentage: totalRatings > 0 ? ((moderate / totalRatings) * 100).toFixed(1) : '0' },
      critical: { count: critical, percentage: totalRatings > 0 ? ((critical / totalRatings) * 100).toFixed(1) : '0' },
      distribution
    };
  }

  // ─── SECTION 3: ASSET PERFORMANCE ───────────────────────────────────────────

  computeAssetPerformance(allRatings) {
    // Group by assetType
    const assetMap = {};
    allRatings.forEach(r => {
      const at = r.assetType || 'Unknown';
      if (!assetMap[at]) {
        assetMap[at] = { totalRatings: 0, sumScore: 0, issues: 0, critical: 0, categories: {}, parameters: {} };
      }
      assetMap[at].totalRatings++;
      assetMap[at].sumScore += r.score;
      if (r.score === 1 || r.score === 5) assetMap[at].issues++;
      if (r.score === 1) assetMap[at].critical++;

      // Category drill-down
      const cat = r.category || 'Unknown';
      if (!assetMap[at].categories[cat]) {
        assetMap[at].categories[cat] = { totalRatings: 0, sumScore: 0, issues: 0 };
      }
      assetMap[at].categories[cat].totalRatings++;
      assetMap[at].categories[cat].sumScore += r.score;
      if (r.score === 1 || r.score === 5) assetMap[at].categories[cat].issues++;

      // Parameter drill-down
      const param = r.parameter || 'Unknown';
      if (!assetMap[at].parameters[param]) {
        assetMap[at].parameters[param] = { totalRatings: 0, sumScore: 0, issues: 0, critical: 0, nonCritical: 0 };
      }
      assetMap[at].parameters[param].totalRatings++;
      assetMap[at].parameters[param].sumScore += r.score;
      if (r.score === 1 || r.score === 5) assetMap[at].parameters[param].issues++;
      if (r.score === 1) assetMap[at].parameters[param].critical++;
      else if (r.score === 5) assetMap[at].parameters[param].nonCritical++;
    });

    // Convert to sorted array
    const assets = Object.entries(assetMap).map(([name, data]) => ({
      assetType: name,
      totalRatings: data.totalRatings,
      avgRating: (data.sumScore / data.totalRatings).toFixed(2),
      issues: data.issues,
      critical: data.critical,
      categories: Object.entries(data.categories).map(([cName, cData]) => ({
        name: cName,
        totalRatings: cData.totalRatings,
        avgRating: (cData.sumScore / cData.totalRatings).toFixed(2),
        issues: cData.issues
      })).sort((a, b) => a.avgRating - b.avgRating),
      parameters: Object.entries(data.parameters).map(([pName, pData]) => ({
        name: pName,
        totalRatings: pData.totalRatings,
        avgRating: (pData.sumScore / pData.totalRatings).toFixed(2),
        issues: pData.issues,
        critical: pData.critical,
        nonCritical: pData.nonCritical
      })).sort((a, b) => a.avgRating - b.avgRating)
    })).sort((a, b) => parseFloat(a.avgRating) - parseFloat(b.avgRating));

    return { assets };
  }

  // ─── SECTION 4: ISSUE INTELLIGENCE ──────────────────────────────────────────

  computeIssueIntelligence(allRatings) {
    // Issues = score 1 or 5
    const issues = allRatings.filter(r => r.score === 1 || r.score === 5);
    const criticalIssues = allRatings.filter(r => r.score === 1);
    const observationIssues = allRatings.filter(r => r.score === 5);

    // By category
    const categoryMap = {};
    issues.forEach(r => {
      const cat = r.category || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, critical: 0 };
      categoryMap[cat].total++;
      if (r.score === 1) categoryMap[cat].critical++;
    });
    const byCategory = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, total: data.total, critical: data.critical }))
      .sort((a, b) => b.total - a.total);

    // By parameter
    const paramMap = {};
    issues.forEach(r => {
      const param = r.parameter || 'Unknown';
      if (!paramMap[param]) paramMap[param] = { total: 0, critical: 0 };
      paramMap[param].total++;
      if (r.score === 1) paramMap[param].critical++;
    });
    const byParameter = Object.entries(paramMap)
      .map(([name, data]) => ({ name, total: data.total, critical: data.critical }))
      .sort((a, b) => b.total - a.total);

    // By remark (using normalized remarks from flattenRatingsForAnalysis)
    const remarkMap = {};
    issues.forEach(r => {
      const remark = r.remark || 'No Remark';
      if (remark && remark !== '') {
        remarkMap[remark] = (remarkMap[remark] || 0) + 1;
      }
    });
    const byRemark = Object.entries(remarkMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Pareto data (for parameter-wise: cumulative percentage)
    let cumulativeCount = 0;
    const paretoData = byParameter.slice(0, 15).map(p => {
      cumulativeCount += p.total;
      return {
        name: p.name,
        count: p.total,
        cumulativePercentage: issues.length > 0 ? ((cumulativeCount / issues.length) * 100).toFixed(1) : '0'
      };
    });

    return {
      totalIssues: issues.length,
      criticalIssues: criticalIssues.length,
      observationIssues: observationIssues.length,
      byCategory,
      byParameter,
      byRemark,
      paretoData
    };
  }

  // ─── SECTION 5: RISK & CRITICALITY ─────────────────────────────────────────

  computeRiskCriticality(allRatings) {
    // Critical observations (score === 1)
    const criticalObservations = allRatings
      .filter(r => r.score === 1)
      .map(r => ({
        chainage: r.chainage,
        assetType: r.assetType,
        category: r.category,
        parameter: r.parameter,
        score: r.score,
        remark: r.remark,
        direction: r.direction,
        imageUrl: r.imageUrl || ''
      }))
      .sort((a, b) => a.chainage - b.chainage);

    // Critical asset categories (assets with highest issue concentration)
    const assetIssueMap = {};
    allRatings.forEach(r => {
      const at = r.assetType || 'Unknown';
      if (!assetIssueMap[at]) assetIssueMap[at] = { total: 0, critical: 0, observation: 0 };
      assetIssueMap[at].total++;
      if (r.score === 1) assetIssueMap[at].critical++;
      if (r.score === 5) assetIssueMap[at].observation++;
    });

    const criticalAssets = Object.entries(assetIssueMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        critical: data.critical,
        observation: data.observation,
        issueRate: data.total > 0 ? (((data.critical + data.observation) / data.total) * 100).toFixed(1) : '0'
      }))
      .filter(a => a.critical > 0 || a.observation > 0)
      .sort((a, b) => b.critical - a.critical);

    // Critical parameters
    const paramIssueMap = {};
    allRatings.filter(r => r.score === 1).forEach(r => {
      const param = r.parameter || 'Unknown';
      paramIssueMap[param] = (paramIssueMap[param] || 0) + 1;
    });
    const criticalParameters = Object.entries(paramIssueMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Critical chainages (chainages with most critical issues)
    const chainageCritMap = {};
    allRatings.filter(r => r.score === 1).forEach(r => {
      const chNum = typeof r.chainage === 'number' ? r.chainage : parseFloat(r.chainage);
      const ch = !isNaN(chNum) ? chNum.toFixed(2) : '0.00';
      chainageCritMap[ch] = (chainageCritMap[ch] || 0) + 1;
    });
    const criticalChainages = Object.entries(chainageCritMap)
      .map(([chainage, count]) => ({ chainage: parseFloat(chainage) || 0, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCritical: criticalObservations.length,
      criticalObservations: criticalObservations.slice(0, 50), // Cap for performance
      criticalAssets,
      criticalParameters,
      criticalChainages
    };
  }

  // ─── SECTION 6: CORRIDOR / CHAINAGE INTELLIGENCE ────────────────────────────

  computeChainageIntelligence(allRatings) {
    if (!allRatings || allRatings.length === 0) {
      return { distribution: [], hotspots: [], minChainage: 0, maxChainage: 0, totalChainageSpan: 0 };
    }

    const validRatings = allRatings.filter(r => {
      const ch = typeof r.chainage === 'number' ? r.chainage : parseFloat(r.chainage);
      return !isNaN(ch);
    });

    if (validRatings.length === 0) {
      return { distribution: [], hotspots: [], minChainage: 0, maxChainage: 0, totalChainageSpan: 0 };
    }

    // Find chainage range
    let minCh = Infinity;
    let maxCh = -Infinity;
    validRatings.forEach(r => {
      const ch = typeof r.chainage === 'number' ? r.chainage : parseFloat(r.chainage);
      if (ch < minCh) minCh = ch;
      if (ch > maxCh) maxCh = ch;
    });

    if (!isFinite(minCh) || !isFinite(maxCh)) {
      return { distribution: [], hotspots: [], minChainage: 0, maxChainage: 0, totalChainageSpan: 0 };
    }

    // Create bins for chainage distribution
    const range = Math.max(0, maxCh - minCh);
    const binCount = Math.min(Math.max(Math.ceil(range / 1), 10), 50); // 1km bins, min 10 max 50
    const binSize = range > 0 ? range / binCount : 1;

    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const start = minCh + (i * binSize);
      const end = minCh + ((i + 1) * binSize);
      bins.push({
        start: parseFloat(start.toFixed(2)) || 0,
        end: parseFloat(end.toFixed(2)) || 0,
        label: `${start.toFixed(1)}–${end.toFixed(1)}`,
        totalRatings: 0,
        issues: 0,
        critical: 0,
        avgRating: 0,
        sumScore: 0
      });
    }

    // Distribute ratings into bins
    validRatings.forEach(r => {
      const ch = typeof r.chainage === 'number' ? r.chainage : parseFloat(r.chainage);
      let binIdx = Math.floor((ch - minCh) / binSize);
      if (binIdx >= binCount) binIdx = binCount - 1;
      if (binIdx < 0 || isNaN(binIdx)) binIdx = 0;
      if (bins[binIdx]) {
        bins[binIdx].totalRatings++;
        bins[binIdx].sumScore += (Number(r.score) || 0);
        if (r.score === 1 || r.score === 5) bins[binIdx].issues++;
        if (r.score === 1) bins[binIdx].critical++;
      }
    });

    // Calculate avg rating per bin
    bins.forEach(b => {
      b.avgRating = b.totalRatings > 0 ? parseFloat((b.sumScore / b.totalRatings).toFixed(2)) : 10;
      delete b.sumScore;
    });

    // Identify hotspots: bins with highest issue density
    const hotspots = bins
      .filter(b => b.issues > 0)
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 10)
      .map(b => ({
        chainageRange: `${b.start.toFixed(2)} – ${b.end.toFixed(2)} km`,
        start: b.start,
        end: b.end,
        issues: b.issues,
        critical: b.critical,
        totalRatings: b.totalRatings,
        avgRating: b.avgRating
      }));

    // Per-chainage detail for direction analysis
    const directionMap = {};
    validRatings.forEach(r => {
      const chNum = typeof r.chainage === 'number' ? r.chainage : parseFloat(r.chainage);
      const ch = !isNaN(chNum) ? chNum.toFixed(2) : '0.00';
      const dir = r.direction || '-';
      const key = `${ch}_${dir}`;
      if (!directionMap[key]) {
        directionMap[key] = { chainage: chNum, direction: dir, issues: 0, total: 0 };
      }
      directionMap[key].total++;
      if (r.score === 1 || r.score === 5) directionMap[key].issues++;
    });

    return {
      distribution: bins,
      hotspots,
      minChainage: parseFloat(minCh.toFixed(2)) || 0,
      maxChainage: parseFloat(maxCh.toFixed(2)) || 0,
      totalChainageSpan: parseFloat(range.toFixed(2)) || 0
    };
  }

  // ─── SECTION 7: INSPECTION COVERAGE ─────────────────────────────────────────

  computeInspectionCoverage(tasks, allRatings) {
    const totalTasks = tasks.length;
    const ratedTasks = tasks.filter(t => t.ratings && t.ratings.length > 0).length;
    const unratedTasks = totalTasks - ratedTasks;

    const withImage = tasks.filter(t => t.image && t.image.cloudinaryUrl).length;
    const withoutImage = totalTasks - withImage;

    // Status breakdown
    const statusMap = {};
    tasks.forEach(t => {
      const status = t.status || 'UNKNOWN';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    // Completed tasks count
    const completedTasks = statusMap['COMPLETED'] || 0;

    return {
      totalRecords: totalTasks,
      ratedRecords: ratedTasks,
      unratedRecords: unratedTasks,
      ratingCoverage: totalTasks > 0 ? ((ratedTasks / totalTasks) * 100).toFixed(1) : '0',
      imagesAvailable: withImage,
      imagesMissing: withoutImage,
      imageCoverage: totalTasks > 0 ? ((withImage / totalTasks) * 100).toFixed(1) : '0',
      completedTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0',
      statusBreakdown: statusMap,
      totalRatingsCount: allRatings.length
    };
  }

  // ─── SECTION 8: EVIDENCE ────────────────────────────────────────────────────

  computeEvidence(allRatings) {
    // Get the most critical/noteworthy observations with images
    const criticalWithImages = allRatings
      .filter(r => r.score === 1 && r.imageUrl)
      .sort((a, b) => a.chainage - b.chainage)
      .slice(0, 6);

    const observationsWithImages = allRatings
      .filter(r => r.score === 5 && r.imageUrl)
      .sort((a, b) => a.chainage - b.chainage)
      .slice(0, 4);

    // Combine: critical first, then observations
    const evidenceItems = [...criticalWithImages, ...observationsWithImages].map(r => ({
      chainage: r.chainage,
      assetType: r.assetType,
      category: r.category,
      parameter: r.parameter,
      score: r.score,
      remark: r.remark,
      direction: r.direction,
      imageUrl: r.imageUrl,
      ratedAt: r.ratedAt
    }));

    // Also provide items without images for transparency
    const criticalWithoutImages = allRatings
      .filter(r => r.score === 1 && !r.imageUrl)
      .length;

    return {
      items: evidenceItems,
      totalCriticalWithImage: allRatings.filter(r => r.score === 1 && r.imageUrl).length,
      totalCriticalWithoutImage: criticalWithoutImages,
      totalEvidenceAvailable: allRatings.filter(r => (r.score === 1 || r.score === 5) && r.imageUrl).length
    };
  }

  // ─── SECTION 9: MANAGEMENT SUMMARY ──────────────────────────────────────────

  computeManagementSummary(overview, condition, issueIntelligence, risk, hotspots, coverage) {
    const topIssueCategory = issueIntelligence.byCategory.length > 0 ? issueIntelligence.byCategory[0].name : 'N/A';
    const topIssueParameter = issueIntelligence.byParameter.length > 0 ? issueIntelligence.byParameter[0].name : 'N/A';
    const majorHotspot = hotspots.hotspots.length > 0 ? hotspots.hotspots[0].chainageRange : 'N/A';
    const majorHotspotIssues = hotspots.hotspots.length > 0 ? hotspots.hotspots[0].issues : 0;

    return {
      projectCondition: `Average current rating: ${overview.averageRating} out of 10`,
      issueProfile: `${issueIntelligence.totalIssues} total issues identified across ${issueIntelligence.byCategory.length} categories. ${issueIntelligence.criticalIssues} critical observations require immediate attention.`,
      criticalCondition: `${risk.totalCritical} critical observations identified across ${risk.criticalParameters.length} parameters.`,
      primaryIssueArea: topIssueCategory,
      primaryIssueParameter: topIssueParameter,
      majorHotspot: majorHotspot,
      majorHotspotIssues: majorHotspotIssues,
      imageCoverage: `${coverage.imageCoverage}%`,
      ratingCoverage: `${coverage.ratingCoverage}%`,
      conditionBreakdown: `Good: ${condition.good.percentage}% | Moderate: ${condition.moderate.percentage}% | Critical: ${condition.critical.percentage}%`,
      totalAssetsAnalyzed: overview.totalAssets,
      totalRatingsAnalyzed: overview.totalRatings
    };
  }

  // ─── DRILL-DOWN RECORDS ───────────────────────────────────────────────────

  async getPerformanceRecordsData(project, cycleId, chainageType, chainageFrom, chainageTo, roadType, direction, assetType, parameter) {
    const tasks = await reportService.getTasksForReport(
      project, cycleId, chainageType, chainageFrom, chainageTo,
      assetType, parameter, roadType, direction
    );
    const allRatings = reportService.flattenRatingsForAnalysis(tasks);
    return this.getPerformanceRecords(allRatings, assetType, parameter);
  }

  getPerformanceRecords(allRatings, assetType, parameter) {
    let filtered = allRatings;
    
    if (assetType && assetType !== 'all') {
      filtered = filtered.filter(r => (r.assetType || 'Unknown') === assetType);
    }
    if (parameter && parameter !== 'all') {
      filtered = filtered.filter(r => (r.parameter || 'Unknown') === parameter);
    }

    // Sort by chainage
    filtered = filtered.sort((a, b) => (a.chainage || 0) - (b.chainage || 0));

    return filtered.map(r => ({
      chainage: r.chainage,
      assetType: r.assetType || 'Unknown',
      parameter: r.parameter || 'Unknown',
      rating: r.score,
      status: r.score === 1 ? 'Critical' : (r.score === 5 ? 'Observation' : 'Good'),
      direction: r.direction || '-',
      remark: r.remark || 'No remark',
      date: r.ratedAt,
      evidence: r.imageUrl || null
    }));
  }
}

module.exports = new PerformanceCenterService();
