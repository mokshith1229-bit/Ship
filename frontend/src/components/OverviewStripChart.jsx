import React, { useState } from 'react';
import { GitCompare, AlertTriangle, CheckCircle, Info, Compass, ArrowRight } from 'lucide-react';

const OverviewStripChart = ({ data, summary }) => {
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [hoveredBucket, setHoveredBucket] = useState(null);

  if (!data || !data.data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="font-semibold text-gray-700">No Comparison Strip Chart Data</p>
        <p className="text-xs text-gray-400 mt-1">Please ensure both Previous and Current cycles are selected.</p>
      </div>
    );
  }

  const { data: directionsMap } = data;
  const directions = Object.keys(directionsMap);
  const activeDirection = selectedDirection && directions.includes(selectedDirection) ? selectedDirection : directions[0] || 'Default';
  const bucketData = directionsMap[activeDirection] || {};
  const bucketKeys = Object.keys(bucketData).sort((a, b) => parseFloat(a.split('-')[0]) - parseFloat(b.split('-')[0]));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header & Direction Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-800">Overview / Comparison Strip Chart (500m Buckets)</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tracking defect resolution and persistence between inspection cycles for <strong>{summary?.projectName || 'Project'}</strong>
          </p>
        </div>

        {/* Direction Tabs */}
        {directions.length > 1 && (
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
            {directions.map((dir) => (
              <button
                key={dir}
                onClick={() => setSelectedDirection(dir)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeDirection === dir
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                {dir}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-5 text-gray-600">
          <span className="font-semibold text-gray-700">Status Legend:</span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
            <span>Resolved / Stable (Green)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block" />
            <span>Persistent Issues (Red)</span>
          </div>
        </div>
      </div>

      {/* Buckets Grid */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100/90 text-gray-700 font-semibold border-b border-gray-200">
              <th className="px-4 py-2.5">Chainage Bucket (500m)</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-center">Previous Issues</th>
              <th className="px-4 py-2.5 text-center">Current Issues</th>
              <th className="px-4 py-2.5 text-center">Resolved</th>
              <th className="px-4 py-2.5 text-center">Persistent</th>
              <th className="px-4 py-2.5 text-center">New Defects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {bucketKeys.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No chainage bucket data found for this selection.
                </td>
              </tr>
            ) : (
              bucketKeys.map((bucketKey) => {
                const item = bucketData[bucketKey];
                const isRed = item?.status === 'Red';
                return (
                  <tr
                    key={bucketKey}
                    onMouseEnter={() => setHoveredBucket({ bucketKey, ...item })}
                    onMouseLeave={() => setHoveredBucket(null)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-bold font-mono text-gray-800">
                      KM {bucketKey}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isRed ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-gray-600">
                      {item.prevCount || 0}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-gray-800">
                      {item.currCount || 0}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-emerald-600">
                      +{item.resolvedCount || 0}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-rose-600">
                      {item.persistentCount || 0}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-amber-600">
                      +{item.newCount || 0}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Hover Info details */}
      {hoveredBucket && (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-bold text-slate-200">
              Details for KM {hoveredBucket.bucketKey} ({activeDirection})
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                hoveredBucket.status === 'Red' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {hoveredBucket.status === 'Red' ? 'Persistent Issues Detected' : 'Resolved / Clear'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Previous Cycle</span>
              <span className="font-bold text-sm text-white">{hoveredBucket.prevCount || 0} issues</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Current Cycle</span>
              <span className="font-bold text-sm text-white">{hoveredBucket.currCount || 0} issues</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Persistent (Carried Over)</span>
              <span className="font-bold text-sm text-rose-400">{hoveredBucket.persistentCount || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Resolved</span>
              <span className="font-bold text-sm text-emerald-400">{hoveredBucket.resolvedCount || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewStripChart;
