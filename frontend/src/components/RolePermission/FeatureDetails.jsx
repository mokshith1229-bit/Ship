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
  
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    // Reset history view when feature changes
    setShowHistory(false);
    setMessage(null);
  }, [selectedFeature]);

  // Extract just the permissions relevant to the currently selected feature for display
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

  // Check if ANY permissions across ANY feature have been modified
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
      // Find ALL modified permissions across all features
      const updates = allPermissions.filter((perm, index) => {
        return !arePermissionsEqual(perm.permissions, originalPermissions[index]?.permissions);
      });

      if (updates.length > 0) {
        // Update them via API
        await Promise.all(
          updates.map(update => roleService.updateRolePermission(update._id, update.permissions))
        );

        // Update the original baseline so "Save Changes" button disables again
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
      
      {/* Alert Message */}
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
            
            {/* Bulk Actions */}
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
