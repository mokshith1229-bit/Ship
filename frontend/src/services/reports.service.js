import api from './api';

export const reportsService = {
  getSPVLeaderboard: async () => {
    try {
      const response = await api.get('/reports/spvs');
      return response.data;
    } catch (err) {
      console.error("Failed to fetch SPV leaderboard:", err);
      return { data: [] };
    }
  },

  getSPVAnalytics: async (spvId) => {
    try {
      const response = await api.get(`/reports/spvs/${spvId}/analytics`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch SPV analytics:", err);
      return { data: null };
    }
  }
};
