import React, { useState } from 'react';
import { MdOutlineSort } from 'react-icons/md';

const AssetHealthRegister = ({ data, selectedAssetType, onSelectAssetType }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'criticalAudits', direction: 'desc' });

  if (!data || data.length === 0) return null;

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Asset Health Register</h2>
        <p className="text-sm text-gray-500">Condition metrics across different asset classes</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('assetType')}>
                <div className="flex items-center gap-1">Asset Type <MdOutlineSort /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('totalAudits')}>
                <div className="flex items-center justify-end gap-1">Total Audits <MdOutlineSort /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('criticalAudits')}>
                <div className="flex items-center justify-end gap-1">Critical Audits <MdOutlineSort /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('criticalRate')}>
                <div className="flex items-center justify-end gap-1">Critical Rate <MdOutlineSort /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('avgRating')}>
                <div className="flex items-center justify-end gap-1">Avg Rating <MdOutlineSort /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {sortedData.map((row, idx) => {
              const isSelected = selectedAssetType === row.assetType;
              return (
                <tr 
                  key={idx} 
                  className={`hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                  onClick={() => onSelectAssetType(isSelected ? null : row.assetType)}
                >
                  <td className="px-5 py-3 font-semibold text-gray-800">{row.assetType}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-600">{row.totalAudits.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-bold text-red-600">{row.criticalAudits.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-700">{row.criticalRate}%</td>
                  <td className="px-5 py-3 text-right font-bold text-indigo-600">{row.avgRating}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetHealthRegister;
