import React, { useState } from 'react';

const CriticalLocationIntelligence = ({ data }) => {
  const [showAll, setShowAll] = useState(false);

  if (!data || data.length === 0) return null;

  const displayData = showAll ? data : data.slice(0, 8);
  const maxTotal = Math.max(...data.map(d => d.criticalAudits || 0));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Critical Location Intelligence</h2>
          <p className="text-sm text-gray-500">Where critical inspection findings are concentrated</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Chainage</th>
              <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Critical Audits</th>
              <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Top Issues</th>
              <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Types</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, idx) => {
              const barWidth = maxTotal > 0 ? `${(row.criticalAudits / maxTotal) * 100}%` : '0%';
              
              return (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      {row.chainage} km
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600 w-8">{row.criticalAudits?.toLocaleString()}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: barWidth }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 max-w-[150px]">
                    <div className="text-xs text-gray-600 truncate" title={row.issues?.join(', ')}>
                      {row.issues?.length > 0 ? row.issues.join(', ') : '-'}
                    </div>
                  </td>
                  <td className="py-3 max-w-[120px]">
                    <div className="text-xs text-gray-500 truncate" title={row.assetTypes?.join(', ')}>
                      {row.assetTypes?.length > 0 ? row.assetTypes.join(', ') : '-'}
                    </div>
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
            className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wide flex items-center gap-1"
          >
            {showAll ? 'Show Less' : `View All Locations (${data.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CriticalLocationIntelligence;
