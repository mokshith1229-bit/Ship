import React from 'react';

const ChainageHotspots = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Chainage Hotspots</h2>
        <p className="text-sm text-gray-500">Locations with the highest critical concentrations</p>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
        <div className="flex flex-col gap-3">
          {data.slice(0, 15).map((loc, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-extrabold text-gray-900 text-base">{loc.chainage} km</h4>
                  <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    {loc.criticalAudits} Critical Audits
                  </span>
                </div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  {loc.assetTypes?.join(', ')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {loc.issues?.map((issue, i) => (
                    <span key={i} className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {issue}
                    </span>
                  ))}
                  {(loc.issues?.length > 3) && <span className="text-[10px] uppercase font-bold text-gray-400">+{loc.issues.length - 3} more</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Avg Rating</div>
                <div className="text-xl font-bold text-indigo-600 leading-none">{loc.avgRating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChainageHotspots;
