import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RoleSelectorCard from '../components/RolePermission/RoleSelectorCard';
import PermissionsCard from '../components/RolePermission/PermissionsCard';

import ActionPermissionCard from '../components/RolePermission/ActionPermissionCard';

const RolePermissionPage = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pageBg">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto w-full pb-10">
            {/* Future Additions: Search box, Action Buttons, etc. */}
            
            <RoleSelectorCard />
            
            <PermissionsCard />
            
            <ActionPermissionCard />
            
            {/* Future Additions: Save/Reset buttons could go here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionPage;
