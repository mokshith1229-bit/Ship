const MasterList = require('../../models/MasterList.model');

class MasterListRepository {
  async getMasterList(filters = {}) {
    const query = {};

    if (filters.project) query.project = filters.project;
    if (filters.category) query.category = filters.category;
    if (filters.assetType) query.assetType = filters.assetType;
    if (filters.status) query.status = filters.status;

    return MasterList.find(query).select('-__v').sort({ createdAt: -1 }).lean();
  }

  async getProjects() {
    return MasterList.distinct('project');
  }

  async getCategories() {
    return MasterList.distinct('category');
  }

  async getAssetTypes() {
    return MasterList.distinct('assetType');
  }

  async getRoadTypes(project) {
    const filter = {};
    if (project) filter.project = project;
    return MasterList.distinct('roadType', filter);
  }

  async getParameters() {
    return MasterList.distinct('parameter');
  }

  async getChainages() {
    return MasterList.distinct('chainage');
  }

  async getStats() {
    const totalQuestions = await MasterList.countDocuments({ status: 'Active' });
    
    // Efficiently get counts of distinct values for KPIs
    const [projects, categories, assetTypes, parameters] = await Promise.all([
      MasterList.distinct('project', { status: 'Active' }),
      MasterList.distinct('category', { status: 'Active' }),
      MasterList.distinct('assetType', { status: 'Active' }),
      MasterList.distinct('parameter', { status: 'Active' })
    ]);

    return {
      totalQuestions,
      totalProjects: projects.length,
      totalCategories: categories.length,
      totalAssetTypes: assetTypes.length,
      totalParameters: parameters.length
    };
  }
}

module.exports = new MasterListRepository();
