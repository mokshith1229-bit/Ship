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
