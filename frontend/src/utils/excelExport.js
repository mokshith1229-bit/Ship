import * as XLSX from 'xlsx';

/**
 * Helper to ensure chainages are formatted as 3 decimals, e.g. 380.000 instead of 379.9999999999333
 */
const formatChainage = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return val;
  return Number(val).toFixed(3);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatus = (rA, rB) => {
  if (rA === null || rB === null || rA === 0 || rB === 0 || isNaN(rA) || isNaN(rB)) return 'Not Rated';
  if (rB > rA) return 'Improved';
  if (rB < rA) return 'Deteriorated';
  if (rA === 1 || rA === 5) return 'Unresolved';
  return 'No Change';
};

export const exportInspectionCommitteeReport = (data, flatA, flatB, meta) => {
  const wb = XLSX.utils.book_new();

  // Common styles (XLSX basic doesn't fully support styles without PRO version, but we can set column widths)
  // We'll rely on the user applying formatting if needed, but we structure it cleanly.

  // ----------------------------------------------------
  // 1. EXECUTIVE SUMMARY
  // ----------------------------------------------------
  
  // Calculate counts for matched items to get precise Improved/Deteriorated/Unresolved
  let improvedCount = 0;
  let deterioratedCount = 0;
  let unresolvedCount = 0;
  let noChangeCount = 0;
  let notRatedCount = 0;

  data.matched.forEach(m => {
    const s = getStatus(
      m.taskA.rating ? Number(m.taskA.rating) : null,
      m.taskB.rating ? Number(m.taskB.rating) : null
    );
    if (s === 'Improved') improvedCount++;
    else if (s === 'Deteriorated') deterioratedCount++;
    else if (s === 'Unresolved') unresolvedCount++;
    else if (s === 'No Change') noChangeCount++;
    else notRatedCount++;
  });

  const execSummaryData = [
    ["INSPECTION COMMITTEE MONTHLY COMPARISON REPORT"],
    [],
    ["Project", meta.projectName],
    ["Previous Month", meta.monthA],
    ["Current Month", meta.monthB],
    ["Report Generated Date", formatDate(new Date())],
    [],
    ["KPI", "Value"],
    ["Previous Month Inspections", data.analytics.rawTaskCountA || data.analytics.completedA || 0],
    ["Current Month Inspections", data.analytics.rawTaskCountB || data.analytics.completedB || 0],
    ["Images Compared", data.kpis.imagesCompared || 0],
    ["Chainages Compared", data.kpis.chainagesCompared || 0],
    ["Previous Overall Rating", data.kpis.overallRatingA],
    ["Current Overall Rating", data.kpis.overallRatingB],
    ["Improved", improvedCount],
    ["Deteriorated", deterioratedCount],
    ["Unresolved", unresolvedCount],
    ["No Change", noChangeCount],
    ["Not Rated", notRatedCount],
    ["Critical Issues — Previous", data.kpis.criticalA],
    ["Critical Issues — Current", data.kpis.criticalB]
  ];

  const wsExec = XLSX.utils.aoa_to_sheet(execSummaryData);
  wsExec['!cols'] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsExec, "Executive Summary");


  // ----------------------------------------------------
  // 2. CHAINAGE COMPARISON
  // ----------------------------------------------------
  const chainageHeader = [
    "Chainage", "Category", "Asset Type", "Asset ID", "Direction", "Parameter",
    "Previous Rating", "Current Rating", "Status",
    "Previous Remark", "Current Remark", "Previous Date", "Current Date",
    "Previous Image Reference", "Current Image Reference"
  ];
  
  const chainageRows = data.matched.map(m => {
    const rA = m.taskA.rating ? Number(m.taskA.rating) : null;
    const rB = m.taskB.rating ? Number(m.taskB.rating) : null;
    const diff = (rA !== null && rB !== null && rA !== 0 && rB !== 0 && !isNaN(rA) && !isNaN(rB)) ? (rB - rA) : '-';
    const status = getStatus(rA, rB);

    return [
      formatChainage(m.chainage),
      m.category || '-',
      m.assetType || '-',
      m.taskB.assetId || m.taskA.assetId || '-',
      m.direction || '-',
      m.parameter || '-',
      rA !== null ? rA : '-',
      rB !== null ? rB : '-',
      status,
      m.taskA.remark || '-',
      m.taskB.remark || '-',
      formatDate(m.taskA.date),
      formatDate(m.taskB.date),
      m.taskA.image || 'No Image',
      m.taskB.image || 'No Image'
    ];
  });

  const wsChainage = XLSX.utils.aoa_to_sheet([chainageHeader, ...chainageRows]);
  wsChainage['!autofilter'] = { ref: `A1:O${chainageRows.length + 1}` };
  wsChainage['!freeze'] = { ySplit: 1 };
  wsChainage['!cols'] = Array(15).fill({ wch: 15 });
  wsChainage['!cols'][5] = { wch: 30 }; // Parameter wider
  XLSX.utils.book_append_sheet(wb, wsChainage, "Chainage Comparison");


  // ----------------------------------------------------
  // 3. CRITICAL ISSUES
  // ----------------------------------------------------
  const criticalHeader = [
    "Chainage", "Category", "Asset Type", "Asset ID", "Direction", "Parameter",
    "Previous Rating", "Current Rating", "Status",
    "Previous Remark", "Current Remark", "Previous Date", "Current Date",
    "Previous Image Reference", "Current Image Reference"
  ];
  
  const criticalRows = [];
  data.matched.forEach(m => {
    const rA = m.taskA.rating ? Number(m.taskA.rating) : null;
    const rB = m.taskB.rating ? Number(m.taskB.rating) : null;
    
    if (rA === 1 || rA === 5 || rB === 1 || rB === 5) {
      criticalRows.push([
        formatChainage(m.chainage),
        m.category || '-',
        m.assetType || '-',
        m.taskB.assetId || m.taskA.assetId || '-',
        m.direction || '-',
        m.parameter || '-',
        rA !== null ? rA : '-',
        rB !== null ? rB : '-',
        getStatus(rA, rB),
        m.taskA.remark || '-',
        m.taskB.remark || '-',
        formatDate(m.taskA.date),
        formatDate(m.taskB.date),
        m.taskA.image || 'No Image',
        m.taskB.image || 'No Image'
      ]);
    }
  });

  const wsCritical = XLSX.utils.aoa_to_sheet([criticalHeader, ...criticalRows]);
  wsCritical['!autofilter'] = { ref: `A1:O${criticalRows.length + 1}` };
  wsCritical['!freeze'] = { ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsCritical, "Critical Issues");





  // ----------------------------------------------------
  // 5. ASSET PERFORMANCE
  // ----------------------------------------------------
  const assetHeader = [
    "Asset ID", "Category", "Asset Type", "Chainage", "Direction",
    "Previous Score", "Current Score", "Status",
    "Critical Previous", "Critical Current"
  ];
  
  const assetMap = {};
  data.matched.forEach(m => {
    const assetId = m.taskB.assetId || m.taskA.assetId;
    if (!assetId) return; // Skip if no real asset ID exists
    
    if (!assetMap[assetId]) {
      assetMap[assetId] = {
        category: m.category,
        assetType: m.assetType,
        chainage: m.chainage,
        direction: m.direction,
        prevTotal: 0, prevCount: 0,
        currTotal: 0, currCount: 0,
        critPrev: 0, critCurr: 0
      };
    }
    
    const rA = m.taskA.rating ? Number(m.taskA.rating) : null;
    const rB = m.taskB.rating ? Number(m.taskB.rating) : null;
    
    if (rA && !isNaN(rA)) {
      assetMap[assetId].prevTotal += rA;
      assetMap[assetId].prevCount++;
      if (rA === 1 || rA === 5) assetMap[assetId].critPrev++;
    }
    if (rB && !isNaN(rB)) {
      assetMap[assetId].currTotal += rB;
      assetMap[assetId].currCount++;
      if (rB === 1 || rB === 5) assetMap[assetId].critCurr++;
    }
  });

  const assetRows = Object.keys(assetMap).map(id => {
    const a = assetMap[id];
    const scoreA = a.prevCount > 0 ? ((a.prevTotal / (a.prevCount * 10)) * 100) : null;
    const scoreB = a.currCount > 0 ? ((a.currTotal / (a.currCount * 10)) * 100) : null;
    
    let status = 'Not Rated';
    if (scoreA !== null && scoreB !== null) {
      if (Math.round(scoreB) > Math.round(scoreA)) status = 'Improved';
      else if (Math.round(scoreB) < Math.round(scoreA)) status = 'Deteriorated';
      else status = 'No Change';
    }

    return [
      id,
      a.category || '-',
      a.assetType || '-',
      formatChainage(a.chainage),
      a.direction || '-',
      scoreA !== null ? Math.round(scoreA) : '-',
      scoreB !== null ? Math.round(scoreB) : '-',
      status,
      a.critPrev,
      a.critCurr
    ];
  });

  const wsAsset = XLSX.utils.aoa_to_sheet([assetHeader, ...assetRows]);
  wsAsset['!autofilter'] = { ref: `A1:J${assetRows.length + 1}` };
  wsAsset['!freeze'] = { ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsAsset, "Asset Performance");


  // ----------------------------------------------------
  // 6. MONTHLY TREND
  // ----------------------------------------------------
  const trendHeader = [
    "Month", "Inspection Count", "Overall Rating", "Critical Issues",
    "Improved", "Deteriorated", "Unresolved", "No Change", "Not Rated"
  ];
  
  const trendRows = [
    [
      meta.monthA,
      data.analytics.rawTaskCountA || data.analytics.completedA || 0,
      data.kpis.overallRatingA,
      data.kpis.criticalA,
      '-', '-', '-', '-', '-' // Delta metrics only apply to the comparison result line
    ],
    [
      meta.monthB,
      data.analytics.rawTaskCountB || data.analytics.completedB || 0,
      data.kpis.overallRatingB,
      data.kpis.criticalB,
      improvedCount,
      deterioratedCount,
      unresolvedCount,
      noChangeCount,
      notRatedCount
    ]
  ];

  const wsTrend = XLSX.utils.aoa_to_sheet([trendHeader, ...trendRows]);
  wsTrend['!freeze'] = { ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsTrend, "Monthly Trend");





  // ----------------------------------------------------
  // 8. INSPECTION DETAILS
  // ----------------------------------------------------
  const detailsHeader = [
    "Project", "Month", "Category", "Asset Type", "Asset ID", "Chainage", "Direction", "Parameter",
    "Rating", "Remark", "Inspection Date", "Image Reference", "Status"
  ];
  
  const extractDetails = (flats, monthName) => {
    return flats.map(t => [
      t.project,
      monthName,
      t.category || '-',
      t.assetType || '-',
      t.assetId || '-',
      formatChainage(t.chainage),
      t.direction || '-',
      t.parameter || '-',
      t.rating || '-',
      t.remark || '-',
      formatDate(t.date),
      t.image || '-',
      t.skipStatus
    ]);
  };

  const detailsRows = [
    ...extractDetails(flatA, meta.monthA),
    ...extractDetails(flatB, meta.monthB)
  ];

  const wsDetails = XLSX.utils.aoa_to_sheet([detailsHeader, ...detailsRows]);
  wsDetails['!autofilter'] = { ref: `A1:M${detailsRows.length + 1}` };
  wsDetails['!freeze'] = { ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsDetails, "Inspection Details");


  // ----------------------------------------------------
  // TRIGGER DOWNLOAD
  // ----------------------------------------------------
  const safeMonthA = meta.monthA.replace(/[^a-z0-9]/gi, '_');
  const safeMonthB = meta.monthB.replace(/[^a-z0-9]/gi, '_');
  XLSX.writeFile(wb, `Inspection_Committee_Comparison_${safeMonthA}_vs_${safeMonthB}.xlsx`);
};
