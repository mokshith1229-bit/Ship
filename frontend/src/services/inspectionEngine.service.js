import api from './api';

export const inspectionEngineService = {
  async createBatch(batchData) {
    const response = await api.post('/inspection-engine/batches', batchData);
    return response.data;
  },

  async listBatches(filters = {}) {
    const response = await api.get('/inspection-engine/batches', { params: filters });
    return response.data;
  },

  async getBatchDetails(batchId) {
    const response = await api.get(`/inspection-engine/batches/${batchId}`);
    return response.data;
  },

  async deleteBatch(batchId) {
    const response = await api.delete(`/inspection-engine/batches/${batchId}`);
    return response.data;
  }
};
