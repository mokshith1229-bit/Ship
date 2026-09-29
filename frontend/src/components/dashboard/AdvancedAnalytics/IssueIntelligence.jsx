import React, { useState } from 'react';
import { MdCheck } from 'react-icons/md';

const IssueIntelligence = ({ data, selectedIssue, onSelectIssue }) => {
  const [showAll, setShowAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'issueCount', direction: 'desc' });

  if (!data || data.length === 0) return null;

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    const valA = parseFloat(a[sortConfig.key]);
    const valB = parseFloat(b[sortConfig.key]);
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const displayData = showAll ? sortedData : sortedData.slice(0, 8);
  const maxTotal = Math.max(...data.map(d => d.issueCount || 0));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Issue Intelligence</h2>
          <p className="text-sm text-gray-500">What issues are being identified most frequently</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('issue')}
              >
                Issue / Parameter {sortConfig.key === 'issue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('issueCount')}
              >
                Frequency {sortConfig.key === 'issueCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('criticalAudits')}
              >
                Critical {sortConfig.key === 'criticalAudits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('criticalRate')}
              >
                Crit % {sortConfig.key === 'criticalRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, idx) => {
              const isSelected = selectedIssue === row.issue;
              const barWidth = maxTotal > 0 ? `${(row.issueCount / maxTotal) * 100}%` : '0%';
              
              return (
                <tr 
                  key={idx} 
                  onClick={() => onSelectIssue(isSelected ? null : row.issue)}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-3 pr-4 max-w-[200px]">
                    <div className="flex items-center gap-2">
                      {isSelected && <MdCheck className="text-amber-600 flex-shrink-0" />}
                      <span className={`font-semibold truncate ${isSelected ? 'text-amber-700' : 'text-gray-700'}`} title={row.issue}>
                        {row.issue}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium w-8">{row.issueCount?.toLocaleString()}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: barWidth }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-sm font-bold ${row.criticalAudits > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {row.criticalAudits?.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-gray-600 font-medium">{row.criticalRate}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length > 8 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-bold text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-wide flex items-center gap-1"
          >
            {showAll ? 'Show Less' : `View All (${data.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueIntelligence;
