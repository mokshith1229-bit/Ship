import api from './api';

export const ratingService = {
  /**
   * Fetch all batches that are READY_FOR_RATING or IN_PROGRESS
   */
  async getReadyBatches() {
    const response = await api.get('/ratings/batches');
    return response.data;
  },

  async getProjectRatings(projectId, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/ratings?projectId=${projectId}&${params}`);
    return response.data;
  },

  async getVersionHistory(projectId) {
    const response = await api.get(`/ratings/version-history?projectId=${projectId}`);
    return response.data;
  },


  /**
   * Fetch all ratable tasks (with images) for a specific batch
   */
  async getBatchTasks(batchId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/ratings/batches/${batchId}/tasks?${query}` : `/ratings/batches/${batchId}/tasks`;
    const response = await api.get(url);
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
   * Export all ratings for a project to CSV
   */
  async exportRatingsCSV(projectId) {
    const response = await api.get(`/ratings/project/${projectId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Skip a task
   */
  async skipTask(taskId, reason, remarks = '') {
    const response = await api.post(`/ratings/tasks/${taskId}/skip`, { reason, remarks });
    return response.data;
  },

  /**
   * Unskip a task
   */
  async unskipTask(taskId, payload) {
    const response = await api.post(`/ratings/tasks/${taskId}/unskip`, payload);
    return response.data;
  }
};
