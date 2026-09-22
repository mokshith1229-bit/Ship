import api from './api';

export const reportService = {
  /**
   * Fetch distinct projects and their inspection cycles
   */
  async getConfig() {
    const response = await api.get('/reports/config');
    return response.data;
  },

  /**
   * Fetch available asset types and their parameters
   */
  async getAssetTypes(project, cycleId, roadType, direction) {
    const response = await api.get('/reports/assets', {
      params: { project, cycleId, roadType, direction }
    });
    return response.data;
  },

  /**
   * Fetch high-level summary metrics for a project/cycle/filters
   */
  async getSummary(project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/summary', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction }
    });
    return response.data;
  },

  /**
   * Fetch strip chart data
   */
  async getStripChartData(project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/strip-chart', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction }
    });
    return response.data;
  },

  /**
   * Fetch overview strip chart data comparing cycles
   */
  async getOverviewStripChartData(project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/overview-strip-chart', {
      params: { project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction }
    });
    return response.data;
  },

  /**
   * Generate or preview Excel report
   */
  async generateExcelReport(project, cycleId, mode = 'download', chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/generate', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);

    if (mode === 'preview') {
      return { success: true, url };
    }

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `HiRATE_Report_${project}_${dateStr}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, url };
  },

  /**
   * Generate or preview PDF report
   */
  async generatePdfReport(project, cycleId, mode = 'download', chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction, isSummary = false) {
    const response = await api.get('/reports/generate-pdf', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction, isSummary },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    if (mode === 'preview') {
      return { success: true, url };
    }

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const prefix = isSummary ? 'Summary_Report' : 'Comprehensive_Audit_Report';
    link.setAttribute('download', `${prefix}_${project}_${dateStr}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, url };
  },

  /**
   * Generate or preview Comparison PDF report
   */
  async generateComparisonPdfReport(project, previousCycle, currentCycle, mode = 'download', chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/generate-comparison-pdf', {
      params: { project, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    if (mode === 'preview') {
      return { success: true, url };
    }

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Issue_Comparison_Report_${project}_${dateStr}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, url };
  },

  // ─── Asset Performance & Decision Center ────────────────────────────────────

  /**
   * Fetch Performance Center analytics data
   */
  async getPerformanceCenterData(project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/performance-center', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction }
    });
    return response.data;
  },

  /**
   * Fetch Performance Center raw records for drill-down
   */
  async getPerformanceRecords(project, cycleId, chainageType, chainageFrom, chainageTo, roadType, direction, assetType, parameter) {
    const response = await api.get('/reports/performance-center/records', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, roadType, direction, assetType, parameter }
    });
    return response.data;
  },

  /**
   * Generate or preview Management PDF report
   */
  async generateManagementPdfReport(project, cycleId, mode = 'download', chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction) {
    const response = await api.get('/reports/generate-management-pdf', {
      params: { project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    if (mode === 'preview') {
      return { success: true, url };
    }

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Management_Report_${project}_${dateStr}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, url };
  }
};
