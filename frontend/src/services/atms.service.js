import api from './api';

class AtmsService {
  async parseExcel(file, projectId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    
    const response = await api.post('/atms/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async generateBatch(projectId, assets, batchName) {
    const response = await api.post('/atms/generate', {
      projectId,
      assets,
      batchName
    });
    return response.data;
  }
}

export const atmsService = new AtmsService();
