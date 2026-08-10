import api from './api';

export const projectService = {
  getAllProjects: () => api.get('/projects', { params: { limit: 1000 } }).then(r => r.data?.data || r.data),
  completeProject: (code) => api.patch(`/projects/code/${code}/complete`).then(r => r.data?.data || r.data),
};
