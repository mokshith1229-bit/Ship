import api from './api';

class ProjectFacilitiesService {
  async parseFacilityExcel(file, projectId) {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    const response = await api.post('/project-facilities/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async generateBatch(data) {
    const response = await api.post('/project-facilities/generate', data);
    return response.data;
  }
}

export const projectFacilitiesService = new ProjectFacilitiesService();
