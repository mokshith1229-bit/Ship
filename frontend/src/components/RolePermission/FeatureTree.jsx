import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdSearch, 
  MdFilterList, 
  MdKeyboardArrowDown, 
  MdKeyboardArrowRight, 
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
  MdSecurity
} from 'react-icons/md';

const FeatureTree = ({ features, selectedFeature, onSelectFeature }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState({});

  const toggleExpand = (moduleId, e) => {
    e.stopPropagation();
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const treeData = useMemo(() => {
    const modules = features.filter(f => f.featureType === 'Module').reverse(); // Flip the order
    const sections = features.filter(f => f.featureType === 'Section');
    
    return modules.map(mod => {
      return {
        ...mod,
        children: sections.filter(sec => sec.parentFeature === mod.featureId)
      };
    });
  }, [features]);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return treeData;
    const lowerSearch = searchTerm.toLowerCase();
    
    return treeData.map(mod => {
      const modMatch = mod.featureName.toLowerCase().includes(lowerSearch);
      const matchingChildren = mod.children.filter(child => 
        child.featureName.toLowerCase().includes(lowerSearch)
      );
      
      if (modMatch || matchingChildren.length > 0) {
        return {
          ...mod,
          children: modMatch ? mod.children : matchingChildren,
          isExpanded: true
        };
      }
      return null;
    }).filter(Boolean);
  }, [treeData, searchTerm]);

  const getIconForModule = (moduleName) => {
    const name = moduleName.toLowerCase();
    if (name.includes('dashboard')) return MdDashboard;
    if (name.includes('master list')) return MdTableChart;
    if (name.includes('inspection')) return MdPolicy;
    if (name.includes('library')) return MdFolderShared;
    if (name.includes('processing')) return MdAutorenew;
    if (name.includes('image')) return MdImageSearch;
    if (name.includes('rating')) return MdStar;
    if (name.includes('ship')) return MdAnalytics;
    if (name.includes('report')) return MdAssessment;
    if (name.includes('notification')) return MdNotifications;
    if (name.includes('user')) return MdPerson;
    if (name.includes('role')) return MdSecurity;
    return MdDashboard;
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 h-full shadow-sm flex flex-col font-sans">
      <div className="mb-4">
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-3">
          Hirate Feature Tree
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
        {filteredTree.map(mod => {
          const isExpanded = searchTerm ? mod.isExpanded : expandedModules[mod.featureId];
          const isSelected = selectedFeature?.featureId === mod.featureId;
          const hasChildren = mod.children.length > 0;
          const Icon = getIconForModule(mod.moduleName);
          
          return (
            <div key={mod.featureId} className="mb-[4px]">
              <div 
                className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-green-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onSelectFeature(mod);
                  if (hasChildren && !isExpanded) {
                    toggleExpand(mod.featureId, { stopPropagation: () => {} });
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {!isSelected && hasChildren ? (
                    <div 
                      className="w-4 h-4 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={(e) => toggleExpand(mod.featureId, e)}
                    >
                      {isExpanded ? <MdKeyboardArrowDown className="text-lg" /> : <MdKeyboardArrowRight className="text-lg" />}
                    </div>
                  ) : (
                    <div className="w-4 h-4"></div>
                  )}
                  
                  <Icon className={`text-[18px] ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-[14px] ${isSelected ? 'font-bold text-green-800' : 'font-medium text-gray-700'}`}>
                    {mod.featureName}
                  </span>
                </div>
                
                {isSelected && hasChildren && (
                  <div 
                    className="w-6 h-6 flex items-center justify-center cursor-pointer text-green-600"
                    onClick={(e) => toggleExpand(mod.featureId, e)}
                  >
                    {isExpanded ? <MdKeyboardArrowDown className="text-xl" /> : <MdKeyboardArrowRight className="text-xl" />}
                  </div>
                )}
              </div>
              
              <AnimatePresence>
                {isExpanded && hasChildren && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col mt-1"
                  >
                    {mod.children.map(child => {
                      const isChildSelected = selectedFeature?.featureId === child.featureId;
                      return (
                        <div 
                          key={child.featureId}
                          className={`flex items-center px-3 py-2 cursor-pointer transition-colors ml-11 rounded-[8px] ${
                            isChildSelected ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          onClick={() => onSelectFeature(child)}
                        >
                          <span className="text-[13px]">{child.featureName}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        
        {filteredTree.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No features found.
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureTree;
