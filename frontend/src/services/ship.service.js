import api from './api';

export const shipService = {
  getOverview: () => api.get('/ship/overview').then(res => res.data?.data || res.data),
  getProjects: () => api.get('/ship/projects').then(res => res.data?.data || res.data),
  getProjectDetails: (id) => api.get(`/ship/projects/${id}`).then(res => res.data?.data || res.data),
};
