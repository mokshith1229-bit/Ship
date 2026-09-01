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
  // Ensure we display Admin, SPV, User in that order, even if some are missing from DB
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
