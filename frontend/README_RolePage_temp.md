# Role Page Components

This document contains all the React components needed for the Role & Feature Visibility Management page.

## 1. RolePermissionPage.jsx (Main Page)
Path: `frontend/src/pages/RolePermissionPage.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RoleKPICards from '../components/RolePermission/RoleKPICards';
import FeatureTree from '../components/RolePermission/FeatureTree';
import FeatureDetails from '../components/RolePermission/FeatureDetails';
import { roleService } from '../services/role.service';

const RolePermissionPage = () => {
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [stats, setStats] = useState({});
  
  // Lifted state to allow cross-feature saving
  const [allPermissions, setAllPermissions] = useState([]);
  const [originalPermissions, setOriginalPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch features and all permissions concurrently
        const [featRes, adminRes, spvRes, userRes] = await Promise.all([
          roleService.getFeatures(),
          roleService.getRolePermissions('Admin'),
          roleService.getRolePermissions('SPV'),
          roleService.getRolePermissions('User')
        ]);
        
        if (featRes.success && featRes.data) {
          setFeatures(featRes.data);
          
          // Compute KPI stats
          const modules = featRes.data.filter(f => f.featureType === 'Module').length;
          
          setStats({
            totalFeatures: featRes.data.length,
            totalModules: modules,
            activePermissions: featRes.data.length * 3 
          });
        }

        const combined = [];
        if (adminRes.success) combined.push(...adminRes.data);
        if (spvRes.success) combined.push(...spvRes.data);
        if (userRes.success) combined.push(...userRes.data);

        setAllPermissions(combined);
        setOriginalPermissions(JSON.parse(JSON.stringify(combined)));
      } catch (err) {
        console.error("Error loading features/permissions:", err);
      }
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleUpdatePermission = (permId, newPermissionsObj) => {
    setAllPermissions(prev => prev.map(p => {
      if (p._id === permId) {
        return { ...p, permissions: { ...p.permissions, ...newPermissionsObj } };
      }
      return p;
    }));
  };

  const handleBulkAction = (featureId, enable) => {
    setAllPermissions(prev => prev.map(p => {
      if (p.featureId === featureId) {
        return { 
          ...p, 
          permissions: { view: enable, create: enable, edit: enable, delete: enable, export: enable } 
        };
      }
      return p;
    }));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pageBg">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-[1600px] mx-auto w-full pb-10 flex flex-col h-full">
            
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-black text-gray-800">Role & Feature Visibility Management</h1>
              <p className="text-gray-500 mt-1">Control visibility and access permissions for HiRATE modules, sections and actions</p>
            </div>
            
            {/* KPI Cards */}
            <RoleKPICards stats={stats} />
            
            {/* Split Pane: Tree & Details */}
            <div className="flex-1 flex gap-6 min-h-[600px] overflow-hidden">
              {/* Left Panel: Feature Tree */}
              <div className="w-[350px] flex-shrink-0">
                <FeatureTree 
                  features={features} 
                  selectedFeature={selectedFeature} 
                  onSelectFeature={setSelectedFeature} 
                />
              </div>
              
              {/* Right Panel: Feature Details & Table */}
              <div className="flex-1 overflow-hidden">
                <FeatureDetails 
                  selectedFeature={selectedFeature} 
                  allPermissions={allPermissions}
                  originalPermissions={originalPermissions}
                  setOriginalPermissions={setOriginalPermissions}
                  onUpdatePermission={handleUpdatePermission}
                  onBulkAction={handleBulkAction}
                  globalLoading={loading}
                />
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionPage;
```

## 2. RoleKPICards.jsx
Path: `frontend/src/components/RolePermission/RoleKPICards.jsx`

```javascript
import React from 'react';
import { motion } from 'framer-motion';
import { MdLayers, MdViewModule, MdSecurity } from 'react-icons/md';

const KPICard = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-borderColor rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between"
    >
      <div>
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{item.title}</h3>
        <h2 className="text-2xl font-black text-gray-800">{item.value}</h2>
      </div>
      <div className={`p-3 rounded-lg ${item.bg} text-2xl shadow-inner`}>
        {item.icon}
      </div>
    </motion.div>
  );
};

const RoleKPICards = ({ stats }) => {
  const kpiData = [
    {
      title: 'Total Features',
      value: stats.totalFeatures || 0,
      icon: <MdLayers className="text-blue-500" />,
      bg: 'bg-blue-50'
    },
    {
      title: 'Modules',
      value: stats.totalModules || 0,
      icon: <MdViewModule className="text-indigo-500" />,
      bg: 'bg-indigo-50'
    },
    {
      title: 'Active Permissions',
      value: stats.activePermissions || 0,
      icon: <MdSecurity className="text-purple-500" />,
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {kpiData.map((item, index) => (
        <KPICard key={index} item={item} index={index} />
      ))}
    </div>
  );
};

export default RoleKPICards;
```

## 3. FeatureTree.jsx
Path: `frontend/src/components/RolePermission/FeatureTree.jsx`

```javascript
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
    const modules = features.filter(f => f.featureType === 'Module').reverse();
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
```

## 4. FeatureDetails.jsx
Path: `frontend/src/components/RolePermission/FeatureDetails.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { MdHistory, MdSave, MdCheckCircle, MdError } from 'react-icons/md';
import RoleTable from './RoleTable';
import { roleService } from '../../services/role.service';

const FeatureDetails = ({ 
  selectedFeature, 
  allPermissions, 
  originalPermissions, 
  setOriginalPermissions,
  onUpdatePermission,
  onBulkAction,
  globalLoading
}) => {
  const [activeTab, setActiveTab] = useState('Role Permissions');
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [message, setMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    setShowHistory(false);
    setMessage(null);
  }, [selectedFeature]);

  const featurePermissions = selectedFeature 
    ? allPermissions.filter(p => p.featureId === selectedFeature.featureId) 
    : [];

  const arePermissionsEqual = (p1, p2) => {
    if (!p1 || !p2) return p1 === p2;
    return !!p1.view === !!p2.view &&
           !!p1.create === !!p2.create &&
           !!p1.edit === !!p2.edit &&
           !!p1.delete === !!p2.delete &&
           !!p1.export === !!p2.export;
  };

  const hasUnsavedChanges = allPermissions.some((perm, index) => {
    return !arePermissionsEqual(perm.permissions, originalPermissions[index]?.permissions);
  });

  const handleUpdatePermission = (permId, newPermissionsObj) => {
    onUpdatePermission(permId, newPermissionsObj);
  };

  const handleBulkAction = (enable) => {
    if (selectedFeature) {
      onBulkAction(selectedFeature.featureId, enable);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setIsSaved(false);
    setMessage(null);
    try {
      const updates = allPermissions.filter((perm, index) => {
        return !arePermissionsEqual(perm.permissions, originalPermissions[index]?.permissions);
      });

      if (updates.length > 0) {
        await Promise.all(
          updates.map(update => roleService.updateRolePermission(update._id, update.permissions))
        );

        setOriginalPermissions(JSON.parse(JSON.stringify(allPermissions)));
      }
      
      setSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
      setSaving(false);
    }
  };

  const handleViewHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    
    try {
      const res = await roleService.getPermissionHistory(selectedFeature.featureId);
      if (res.success) {
        setHistoryData(res.data);
        setShowHistory(true);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load history.' });
    }
  };

  if (!selectedFeature) {
    return (
      <div className="bg-white border border-borderColor rounded-xl shadow-sm h-full flex items-center justify-center text-gray-500">
        Select a feature from the tree to view its details.
      </div>
    );
  }

  const tabs = ['Role Permissions'];

  return (
    <div className="bg-white border border-borderColor rounded-xl shadow-sm h-full flex flex-col overflow-hidden relative">
      <div className="p-6 border-b border-borderColor bg-gray-50 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{selectedFeature.featureName}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedFeature.featureType} &bull; Module: {selectedFeature.moduleName}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleViewHistory}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold"
          >
            <MdHistory className="text-lg" />
            {showHistory ? 'Hide History' : 'History'}
          </button>
          
          <button 
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold ${
              isSaved && !hasUnsavedChanges
                ? 'bg-green-600 text-white'
                : hasUnsavedChanges && !saving 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <MdSave className="text-lg" />
            {saving ? 'Saving...' : (isSaved && !hasUnsavedChanges) ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`px-6 py-3 border-b flex items-center gap-2 text-sm font-bold ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? <MdCheckCircle className="text-lg" /> : <MdError className="text-lg" />}
          {message.text}
        </div>
      )}
      
      {showHistory ? (
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          <h3 className="font-bold text-gray-800 mb-4">Permission Change History</h3>
          {historyData.length === 0 ? (
            <p className="text-gray-500 text-sm">No history found for this feature.</p>
          ) : (
            <div className="space-y-4">
              {historyData.map((record, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800">Role: {record.roleId}</span>
                    <span className="text-xs text-gray-500">{new Date(record.changedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Modified By:</span> {record.changedBy}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-2 rounded border border-red-100">
                      <p className="text-xs font-bold text-red-600 mb-1">Old Permissions</p>
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(record.oldPermission, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-green-50 p-2 rounded border border-green-100">
                      <p className="text-xs font-bold text-green-600 mb-1">New Permissions</p>
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(record.newPermission, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="border-b border-borderColor px-6 flex justify-between items-end">
            <div className="flex gap-6 mt-4">
              {tabs.map(tab => (
                <button
                  key={tab}
                  className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-green-500 text-green-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {activeTab === 'Role Permissions' && (
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => handleBulkAction(true)}
                  className="text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded"
                >
                  Enable All Roles
                </button>
                <button
                  onClick={() => handleBulkAction(false)}
                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded"
                >
                  Disable All Roles
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {globalLoading ? (
              <div className="flex justify-center items-center h-32 text-gray-500">Loading permissions...</div>
            ) : (
              <>
                {activeTab === 'Role Permissions' && (
                   <RoleTable 
                     featurePermissions={featurePermissions} 
                     onUpdatePermission={handleUpdatePermission} 
                   />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FeatureDetails;
```

## 5. RoleTable.jsx
Path: `frontend/src/components/RolePermission/RoleTable.jsx`

```javascript
import React from 'react';
import { MdCheck, MdClose } from 'react-icons/md';

const AccessBadge = ({ roleName, permissions }) => {
  if (!permissions) return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold">Unknown</span>;
  
  const { view, create, edit, delete: del, export: exp } = permissions;
  
  if (!view && !create && !edit && !del && !exp) {
    return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[11px] font-bold uppercase tracking-wider">No Access</span>;
  }
  
  if (roleName === 'Admin' || (view && create && edit && del && exp)) {
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-bold uppercase tracking-wider">Full Access</span>;
  }
  
  if (roleName === 'SPV') {
    return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-wider">Review Access</span>;
  }
  
  return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[11px] font-bold uppercase tracking-wider">Limited Access</span>;
};

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input 
      type="checkbox" 
      className="sr-only peer" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
    />
    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
  </label>
);

const RoleTable = ({ roles, featurePermissions, onUpdatePermission }) => {
  const displayRoles = ['Admin', 'SPV', 'User'];
  
  return (
    <div className="overflow-x-auto border border-borderColor rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-borderColor">
          <tr>
            <th className="p-4 font-bold text-sm text-gray-700 uppercase tracking-wider w-1/5">Role</th>
            <th className="p-4 font-bold text-sm text-gray-700 uppercase tracking-wider w-1/6">Visibility</th>
            <th className="p-4 font-bold text-sm text-gray-700 uppercase tracking-wider w-1/6">Access Level</th>
            <th className="p-4 font-bold text-sm text-gray-700 uppercase tracking-wider">Permissions</th>
          </tr>
        </thead>
        <tbody>
          {displayRoles.map((roleName, index) => {
            const rolePerm = featurePermissions.find(p => p.roleId === roleName);
            const permissions = rolePerm?.permissions || { view: false, create: false, edit: false, delete: false, export: false };
            
            const handleToggle = (key, value) => {
              if (rolePerm) {
                onUpdatePermission(rolePerm._id, { [key]: value });
              }
            };
            
            return (
              <tr key={roleName} className={`border-b border-borderColor hover:bg-gray-50 transition-colors ${index === displayRoles.length - 1 ? 'border-none' : ''}`}>
                <td className="p-4 font-bold text-gray-800">
                  {roleName}
                </td>
                <td className="p-4">
                  {permissions.view ? (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <MdCheck className="text-lg" /> Visible
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 font-medium">
                      <MdClose className="text-lg" /> Hidden
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <AccessBadge roleName={roleName} permissions={permissions} />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">View</span>
                      <ToggleSwitch checked={!!permissions.view} onChange={(v) => handleToggle('view', v)} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Create</span>
                      <ToggleSwitch checked={!!permissions.create} onChange={(v) => handleToggle('create', v)} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Edit</span>
                      <ToggleSwitch checked={!!permissions.edit} onChange={(v) => handleToggle('edit', v)} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Delete</span>
                      <ToggleSwitch checked={!!permissions.delete} onChange={(v) => handleToggle('delete', v)} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Export</span>
                      <ToggleSwitch checked={!!permissions.export} onChange={(v) => handleToggle('export', v)} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoleTable;
```
