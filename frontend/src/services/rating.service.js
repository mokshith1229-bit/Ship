import api from './api';

export const ratingService = {
  /**
   * Fetch all batches that are READY_FOR_RATING or IN_PROGRESS
   */
  async getReadyBatches() {
    const response = await api.get('/ratings/batches');
    return response.data;
  },

  /**
   * Fetch ratable tasks for a specific batch, with optional pagination.
   * @param {string} batchId
   * @param {object} [opts] - { page, limit } for pagination; omit for full list
   */
  async getBatchTasks(batchId, opts = {}) {
    const params = {};
    if (opts.page) params.page = opts.page;
    if (opts.limit) params.limit = opts.limit;
    if (opts.category && opts.category !== 'All') params.category = opts.category;
    if (opts.direction && opts.direction !== 'Choose Direction' && opts.direction !== 'All') params.direction = opts.direction;
    if (opts.roadType && opts.roadType !== 'Choose Road Type' && opts.roadType !== 'All') params.roadType = opts.roadType;
    if (opts.minChainage) params.minChainage = opts.minChainage;
    if (opts.maxChainage) params.maxChainage = opts.maxChainage;
    const response = await api.get(`/ratings/batches/${batchId}/tasks`, { params });
    return response.data;
  },

  /**
   * Save ratings for a single task
   */
  async saveTaskRatings(taskId, ratings, selectedImageUrl) {
    const response = await api.post(`/ratings/tasks/${taskId}/rate`, { ratings, selectedImageUrl });
    return response.data;
  },

  /**
   * Export all ratings for a project to CSV, optionally filtered by batch
   */
  async exportRatingsCSV(projectId, batchId) {
    const url = batchId ? `/ratings/project/${projectId}/export?batchId=${batchId}` : `/ratings/project/${projectId}/export`;
    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Skip a task
   */
  async skipTask(taskId, payload) {
    const response = await api.post(`/ratings/tasks/${taskId}/skip`, payload);
    return response.data;
  }
};
