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
   * Fetch all ratable tasks (with images) for a specific batch
   */
  async getBatchTasks(batchId) {
    const response = await api.get(`/ratings/batches/${batchId}/tasks`);
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
  }
};
