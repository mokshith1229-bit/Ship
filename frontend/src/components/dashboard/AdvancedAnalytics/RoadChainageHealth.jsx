import React from 'react';

const RoadChainageHealth = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Road / Chainage Health</h2>
        <p className="text-sm text-gray-500">Condition variations along the road network (10 km segments)</p>
      </div>
      
      <div className="overflow-x-auto p-5">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 px-2">Chainage Range</th>
              <th className="pb-3 px-2 text-right">Total Audits</th>
              <th className="pb-3 px-2 text-right">Critical Audits</th>
              <th className="pb-3 px-2 text-right">Critical Rate</th>
              <th className="pb-3 px-2 text-right">Average Rating</th>
              <th className="pb-3 px-2 text-right">Health Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((row, idx) => {
              const rate = parseFloat(row.criticalRate);
              let colorClass = 'bg-emerald-400';
              if (rate > 50) colorClass = 'bg-red-500';
              else if (rate > 20) colorClass = 'bg-amber-400';

              return (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 font-bold text-gray-800">{row.rangeStart} – {row.rangeEnd} km</td>
                  <td className="py-3 px-2 text-right font-medium text-gray-600">{row.totalAudits.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right font-bold text-red-600">{row.criticalAudits.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-700">{row.criticalRate}%</td>
                  <td className="py-3 px-2 text-right font-bold text-indigo-600">{row.avgRating}</td>
                  <td className="py-3 px-2 w-32">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className={`h-full ${colorClass}`} style={{ width: `${rate}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoadChainageHealth;
