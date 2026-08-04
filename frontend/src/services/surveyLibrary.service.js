import api from './api';

export const surveyLibraryService = {
  async getLibrary(project) {
    const response = await api.get(`/survey-library/${project}`);
    return response.data;
  },

  async createAsset(project, assetName, roadType, videoFile, vttFile) {
    const formData = new FormData();
    formData.append('assetName', assetName);
    if (roadType) formData.append('roadType', roadType);
    formData.append('video', videoFile);
    formData.append('vtt', vttFile);
    
    const response = await api.post(`/survey-library/${project}/asset`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async updateAsset(project, assetId, assetName, roadType, videoFile, vttFile) {
    const formData = new FormData();
    if (assetName) formData.append('assetName', assetName);
    if (roadType) formData.append('roadType', roadType);
    if (videoFile) formData.append('video', videoFile);
    if (vttFile) formData.append('vtt', vttFile);
    
    const response = await api.put(`/survey-library/${project}/asset/${assetId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async deleteAsset(project, assetId) {
    const response = await api.delete(`/survey-library/${project}/asset/${assetId}`);
    return response.data;
  }
};
