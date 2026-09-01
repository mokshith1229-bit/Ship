'use strict';

const projectRepo = require('../repositories/project.repository');
const inspectionRepo = require('../repositories/inspection.repository');
const healthEngine = require('../analytics/health.engine');

class ProjectAnalyticsService {
  async getProjectIntelligence() {
    const projects = await projectRepo.getActiveProjects();
    const batches = await inspectionRepo.findBatches({});
    const tasks = await inspectionRepo.findTasks({});
    const inspections = await inspectionRepo.findInspections({});

    const intelligenceList = projects.map(p => {
      const code = p.code || p.name;
      
      const pBatches = batches.filter(b => b.project === code).map(b => b._id.toString());
      const pTasks = tasks.filter(t => pBatches.includes(t.batchId?.toString()));
      const pInspections = inspections.filter(i => i.projectId?.toString() === p._id.toString());
      
      const tasksCount = pTasks.length;
      const imagesCount = pTasks.filter(t => t.image && t.image.url).length;
      
      let sumRatings = 0, countRatings = 0, critical = 0;
      const assets = new Set(), categories = new Set();
      
      pInspections.forEach(insp => {
        categories.add(insp.category);
        if (insp.assetId) assets.add(insp.assetId);
        
        insp.parameters.forEach(param => {
          const maxVal = Math.max(param.hoRating?.value || 0, param.spvRating?.value || 0);
          if (maxVal > 0) {
            sumRatings += maxVal;
            countRatings++;
            if (maxVal === 1) critical++;
          }
        });
      });

      const avgRating = countRatings > 0 ? (sumRatings / countRatings) : 0;
      
      const metrics = {
        inspectionProgress: tasksCount > 0 ? (imagesCount / tasksCount) * 100 : 0,
        ratingCompletion: pInspections.length > 0 ? (countRatings / (pInspections.length * 5)) * 100 : 0, // Approx
        averageRating: avgRating,
        criticalIssuesCount: critical,
        totalIssuesCount: countRatings > 0 ? countRatings : 1,
        imageReviewCompletion: 100 // placeholder
      };

      const health = healthEngine.calculateHealthScore(metrics);

      return {
        id: p._id,
        name: p.fullName || p.name || code,
        code: code,
        healthScore: health.score,
        healthStatus: health.status,
        inspectionProgress: Math.round(metrics.inspectionProgress),
        averageRating: parseFloat(avgRating.toFixed(1)),
        criticalIssues: critical,
        totalAssets: assets.size,
        totalCategories: categories.size,
        totalQuestions: tasksCount,
        totalImages: imagesCount,
        trend: health.score >= 80 ? 'up' : (health.score <= 40 ? 'down' : 'stable')
      };
    });

    return intelligenceList;
  }
}

module.exports = new ProjectAnalyticsService();
