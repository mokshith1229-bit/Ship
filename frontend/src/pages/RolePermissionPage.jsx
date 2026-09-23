import React, { useState, useEffect, useCallback } from 'react';
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch features and all permissions concurrently from backend
      const [featRes, adminRes, spvRes, userRes] = await Promise.all([
        roleService.getFeatures(),
        roleService.getRolePermissions('Admin'),
        roleService.getRolePermissions('SPV'),
        roleService.getRolePermissions('User')
      ]);
      
      let fetchedFeatures = [];
      if (featRes.success && Array.isArray(featRes.data)) {
        fetchedFeatures = featRes.data;
        setFeatures(fetchedFeatures);
        
        // Auto select first module (Dashboard)
        if (fetchedFeatures.length > 0) {
          setSelectedFeature(prev => prev ? fetchedFeatures.find(f => f.featureId === prev.featureId) || fetchedFeatures[0] : fetchedFeatures[0]);
        }
      }

      const combined = [];
      if (adminRes.success && Array.isArray(adminRes.data)) combined.push(...adminRes.data);
      if (spvRes.success && Array.isArray(spvRes.data)) combined.push(...spvRes.data);
      if (userRes.success && Array.isArray(userRes.data)) combined.push(...userRes.data);

      // Deduplicate permissions by roleId + featureId
      const uniquePermsMap = new Map();
      combined.forEach(p => {
        const key = `${p.roleId}_${p.featureId}`;
        if (!uniquePermsMap.has(key)) {
          uniquePermsMap.set(key, p);
        }
      });
      const uniquePerms = Array.from(uniquePermsMap.values());

      setAllPermissions(uniquePerms);
      setOriginalPermissions(JSON.parse(JSON.stringify(uniquePerms)));

      // Compute KPI stats
      const modulesCount = fetchedFeatures.filter(f => f.featureType === 'Module').length;
      const activeCount = uniquePerms.filter(p => p.permissions && p.permissions.view).length;
      
      setStats({
        totalFeatures: fetchedFeatures.length,
        totalModules: modulesCount,
        activePermissions: uniquePerms.length
      });
    } catch (err) {
      console.error("Error loading features/permissions:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdatePermission = (permId, newPermissionsObj, roleName, featureId) => {
    setAllPermissions(prev => {
      let found = false;
      const updated = prev.map(p => {
        if ((permId && p._id === permId) || (p.roleId === roleName && p.featureId === featureId)) {
          found = true;
          return { ...p, permissions: { ...p.permissions, ...newPermissionsObj } };
        }
        return p;
      });

      if (!found && roleName && featureId) {
        updated.push({
          roleId: roleName,
          featureId: featureId,
          permissions: { view: false, create: false, edit: false, delete: false, export: false, ...newPermissionsObj }
        });
      }

      return updated;
    });
  };

  const handleBulkAction = (featureId, enable) => {
    const roles = ['Admin', 'SPV', 'User'];
    setAllPermissions(prev => {
      const updated = [...prev];
      roles.forEach(roleName => {
        const existingIndex = updated.findIndex(p => p.featureId === featureId && p.roleId === roleName);
        const newPerms = { view: enable, create: enable, edit: enable, delete: enable, export: enable };
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], permissions: newPerms };
        } else {
          updated.push({
            roleId: roleName,
            featureId: featureId,
            permissions: newPerms
          });
        }
      });
      return updated;
    });
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
