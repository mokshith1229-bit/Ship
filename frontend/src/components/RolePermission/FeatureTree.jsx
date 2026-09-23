import React, { useState, useMemo } from 'react';
import { 
  MdSearch, 
  MdFilterList, 
  MdDashboard, 
  MdTableChart, 
  MdPolicy, 
  MdFolderShared, 
  MdAutorenew, 
  MdImageSearch, 
  MdStar, 
  MdAnalytics, 
  MdAssessment, 
  MdNotifications, 
  MdPerson,
  MdSecurity,
  MdAddRoad,
  MdConstruction,
  MdBusiness,
  MdCameraAlt,
  MdInsertChart
} from 'react-icons/md';

const FeatureTree = ({ features = [], selectedFeature, onSelectFeature }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract top-level modules only and deduplicate
  const moduleList = useMemo(() => {
    const seen = new Set();
    const modules = [];

    features.forEach(f => {
      if (f.featureType === 'Module' && !seen.has(f.featureId)) {
        seen.add(f.featureId);
        modules.push(f);
      }
    });

    return modules;
  }, [features]);

  // Search filter for modules
  const filteredModules = useMemo(() => {
    if (!searchTerm) return moduleList;
    const lowerSearch = searchTerm.toLowerCase();
    return moduleList.filter(mod => 
      mod.featureName.toLowerCase().includes(lowerSearch) ||
      (mod.moduleName && mod.moduleName.toLowerCase().includes(lowerSearch))
    );
  }, [moduleList, searchTerm]);

  const getIconForModule = (moduleName = '') => {
    const name = moduleName.toLowerCase();
    if (name.includes('dashboard')) return MdDashboard;
    if (name.includes('master list')) return MdTableChart;
    if (name.includes('inspection')) return MdPolicy;
    if (name.includes('roadway')) return MdAddRoad;
    if (name.includes('structure')) return MdConstruction;
    if (name.includes('project facilities') || name.includes('facilities')) return MdBusiness;
    if (name.includes('atms')) return MdCameraAlt;
    if (name.includes('library')) return MdFolderShared;
    if (name.includes('processing')) return MdAutorenew;
    if (name.includes('image')) return MdImageSearch;
    if (name.includes('rating')) return MdStar;
    if (name.includes('ship')) return MdAnalytics;
    if (name.includes('report')) return MdAssessment;
    if (name.includes('notification')) return MdNotifications;
    if (name.includes('user insights') || name.includes('insights')) return MdInsertChart;
    if (name.includes('user')) return MdPerson;
    if (name.includes('role')) return MdSecurity;
    return MdDashboard;
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 h-full shadow-sm flex flex-col font-sans">
      <div className="mb-4">
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-3">
          HiRATE Feature Tree
        </h3>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search features..."
              className="w-full pl-9 pr-4 h-[40px] border border-gray-200 rounded-[10px] focus:outline-none focus:border-green-500 text-sm text-gray-700 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center w-[40px] h-[40px] border border-gray-200 rounded-[10px] text-gray-500 hover:bg-gray-50 transition-colors shrink-0">
            <MdFilterList className="text-xl" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredModules.map(mod => {
          const isSelected = selectedFeature?.featureId === mod.featureId;
          const Icon = getIconForModule(mod.moduleName);
          
          return (
            <div key={mod.featureId} className="mb-[4px]">
              <div 
                className={`flex items-center px-3 py-2.5 rounded-[10px] cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-green-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelectFeature(mod)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`text-[18px] ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-[14px] ${isSelected ? 'font-bold text-green-800' : 'font-medium text-gray-700'}`}>
                    {mod.featureName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredModules.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No features found.
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureTree;
