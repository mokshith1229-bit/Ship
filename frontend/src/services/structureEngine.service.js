import api from './api';

export const structureEngineService = {
  async detectSheets(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/structure-engine/detect-sheets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async parseExcel(file, interval = 20, selectedSheets = [], minChainage = null, maxChainage = null, structureTypeFilter = 'All Structures') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('interval', interval);
    if (selectedSheets.length > 0) {
      formData.append('selectedSheets', JSON.stringify(selectedSheets));
    }
    if (minChainage !== null) formData.append('minChainage', minChainage);
    if (maxChainage !== null) formData.append('maxChainage', maxChainage);
    if (structureTypeFilter) formData.append('structureTypeFilter', structureTypeFilter);

    const response = await api.post('/structure-engine/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async generateBatch(data) {
    const response = await api.post('/structure-engine/generate', data);
    return response.data;
  }
};
