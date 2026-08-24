export const processComparisonData = (tasksA, tasksB) => {
  const getTaskKey = (t) => `${t.project}-${t.category}-${t.assetType}-${t.parameter}-${t.chainage}-${t.direction}`;
  
  const mapA = new Map();
  tasksA.forEach(t => mapA.set(getTaskKey(t), t));

  const matched = [];
  const newObservations = [];
  
  tasksB.forEach(tB => {
    const key = getTaskKey(tB);
    const tA = mapA.get(key);
    
    if (tA) {
      const ratingA = Number(tA.rating);
      const ratingB = Number(tB.rating);
      
      let status = 'unchanged';
      let difference = 0;
      
      if (!isNaN(ratingA) && !isNaN(ratingB)) {
        difference = ratingB - ratingA;
        if (ratingB > ratingA) status = 'improved';
        else if (ratingB < ratingA) status = 'deteriorated';
      }
      
      matched.push({
        taskA: tA,
        taskB: tB,
        status,
        difference,
        chainage: tB.chainage,
        category: tB.category,
        assetType: tB.assetType,
        parameter: tB.parameter,
        direction: tB.direction,
        roadType: tB.roadType
      });
      mapA.delete(key);
    } else {
      newObservations.push(tB);
    }
  });

  const resolvedIssues = Array.from(mapA.values()); // Missing in B

  // KPI Calculations
  let improvedIssues = 0;
  let deterioratedIssues = 0;
  let unchangedIssues = 0;
  let criticalImagesCompared = 0;
  
  const criticalIssues = [];
  const chainages = [];
  const mapPoints = [];

  matched.forEach(m => {
    if (m.status === 'improved') improvedIssues++;
    if (m.status === 'deteriorated') deterioratedIssues++;
    if (m.status === 'unchanged') unchangedIssues++;
    
    const rA = Number(m.taskA.rating);
    const rB = Number(m.taskB.rating);
    
    // Check if it's a critical issue
    if ([1, 5].includes(rA) || [1, 5].includes(rB)) {
      criticalImagesCompared++;
      criticalIssues.push({
        chainage: m.chainage,
        category: m.category,
        asset: m.assetType,
        parameter: m.parameter,
        prev: {
          rating: rA,
          remark: m.taskA.remark || '',
          date: new Date(m.taskA.date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          image: m.taskA.image || 'https://via.placeholder.com/800?text=No+Image'
        },
        curr: {
          rating: rB,
          remark: m.taskB.remark || '',
          date: new Date(m.taskB.date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          image: m.taskB.image || 'https://via.placeholder.com/800?text=No+Image'
        },
        status: m.status === 'improved' ? 'Improved' : m.status === 'deteriorated' ? 'Deteriorated' : 'No Change'
      });
    }

    // Populate chainages array
    chainages.push({
      chainage: m.chainage,
      category: m.category,
      parameter: m.parameter,
      ratingA: rA,
      ratingB: rB,
      diff: m.difference,
      status: m.status === 'improved' ? 'Improved' : m.status === 'deteriorated' ? 'Deteriorated' : 'No Change'
    });
    
    // Populate mapPoints
    if (m.taskB.metadata && m.taskB.metadata.latitude && m.taskB.metadata.longitude) {
      mapPoints.push({
        lat: m.taskB.metadata.latitude,
        lng: m.taskB.metadata.longitude,
        status: m.status === 'improved' ? 'Improved' : m.status === 'deteriorated' ? 'Deteriorated' : 'No Change',
        chainage: m.chainage,
        type: m.parameter
      });
    }
  });

  // Analytics Phase 3
  const calcStats = (tasks) => {
    let totalScore = 0;
    let count = 0;
    let criticalCount = 0;
    let perfect10 = 0;
    let skipped = 0;
    let completed = 0;
    let imagesCompared = 0;

    tasks.forEach(t => {
      if (t.skipStatus === 'Skipped') {
        skipped++;
      } else {
        completed++;
        if (t.image) imagesCompared++;
        const r = Number(t.rating);
        if (!isNaN(r)) {
          totalScore += r;
          count++;
          if (r === 1 || r === 5) criticalCount++;
          if (r === 10) perfect10++;
        }
      }
    });

    const averageRating = count > 0 ? (totalScore / count) : 0;
    const overallRating = count > 0 ? ((totalScore / (count * 10)) * 100) : 0;

    return { overallRating, averageRating, criticalCount, perfect10, skipped, completed, count, imagesCompared };
  };

  const statsA = calcStats(tasksA);
  const statsB = calcStats(tasksB);

  // Top improvements / deteriorations (based on individual parameter differences, grouped by parameter name)
  const paramDiffs = {};
  matched.forEach(m => {
    if (!paramDiffs[m.parameter]) {
      paramDiffs[m.parameter] = { name: m.parameter, diff: 0, count: 0 };
    }
    paramDiffs[m.parameter].diff += m.difference;
    paramDiffs[m.parameter].count++;
  });
  
  const allParams = Object.values(paramDiffs).map(p => ({
    name: p.name,
    diff: Math.round((p.diff / p.count) * 10) / 10
  }));
  
  const topImprovements = [...allParams].filter(p => p.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5);
  const topDeteriorations = [...allParams].filter(p => p.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);

  const kpis = {
    overallRatingA: Number(statsA.overallRating.toFixed(1)),
    overallRatingB: Number(statsB.overallRating.toFixed(1)),
    overallRatingDiff: Number((statsB.overallRating - statsA.overallRating).toFixed(1)),
    criticalA: statsA.criticalCount,
    criticalB: statsB.criticalCount,
    criticalDiff: statsB.criticalCount - statsA.criticalCount,
    perfect10A: statsA.perfect10,
    perfect10B: statsB.perfect10,
    perfect10Diff: statsB.perfect10 - statsA.perfect10,
    imagesCompared: statsB.imagesCompared,
    chainagesCompared: matched.length
  };

  const analytics = {
    ...kpis,
    averageRatingDiff: statsB.averageRating - statsA.averageRating,
    averageRatingA: statsA.averageRating,
    averageRatingB: statsB.averageRating,
    completedDiff: statsB.completed - statsA.completed,
    completedA: statsA.completed,
    completedB: statsB.completed,
    skippedDiff: statsB.skipped - statsA.skipped,
    skippedA: statsA.skipped,
    skippedB: statsB.skipped,
  };

  // Category Performance (Phase 4)
  const categoryStatsA = {};
  const categoryStatsB = {};

  const processCategory = (tasks, catObj) => {
    tasks.forEach(t => {
      const r = Number(t.rating);
      if (!isNaN(r) && t.skipStatus !== 'Skipped') {
        const cat = t.category || 'Other';
        if (!catObj[cat]) catObj[cat] = { total: 0, count: 0 };
        catObj[cat].total += r;
        catObj[cat].count++;
      }
    });
  };

  processCategory(tasksA, categoryStatsA);
  processCategory(tasksB, categoryStatsB);

  const categories = Object.keys(categoryStatsB).map(cat => {
    const a = categoryStatsA[cat] ? (categoryStatsA[cat].total / (categoryStatsA[cat].count * 10)) * 100 : null;
    const b = (categoryStatsB[cat].total / (categoryStatsB[cat].count * 10)) * 100;
    return {
      name: cat,
      aug: a !== null ? Math.round(a) : 0,
      sep: Math.round(b),
      diff: a !== null ? Math.round(b - a) : Math.round(b)
    };
  });

  const insights = [
    `Overall project health ${kpis.overallRatingDiff > 0 ? 'improved' : 'declined'} by ${Math.abs(kpis.overallRatingDiff).toFixed(1)}%.`,
    `${Math.abs(kpis.criticalDiff)} critical observations were ${kpis.criticalDiff < 0 ? 'rectified' : 'added'}.`,
    topImprovements.length > 0 ? `${topImprovements[0].name} showed the highest improvement.` : 'No significant improvements detected.',
    topDeteriorations.length > 0 ? `${topDeteriorations[0].name} requires immediate attention due to deterioration.` : 'No significant deterioration detected.',
    `${kpis.imagesCompared} visual assets were compared across ${kpis.chainagesCompared} parameters.`
  ];

  return {
    matched,
    newObservations,
    resolvedIssues,
    kpis,
    analytics,
    categories,
    topImprovements,
    topDeteriorations,
    criticalIssues,
    chainages,
    mapPoints,
    insights
  };
};
