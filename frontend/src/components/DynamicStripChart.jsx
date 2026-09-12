import React, { useState } from 'react';
import { Layers, AlertCircle, CheckCircle2, Info, Compass } from 'lucide-react';

const DynamicStripChart = ({ data, summary }) => {
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!data || !data.rows || !data.cols || !data.data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="font-semibold text-gray-700">No Strip Chart Data Available</p>
        <p className="text-xs text-gray-400 mt-1">Try selecting a different cycle, road type, or chainage filter.</p>
      </div>
    );
  }

  const { rows, cols, data: directionsMap } = data;
  const directions = Object.keys(directionsMap);
  const activeDirection = selectedDirection && directions.includes(selectedDirection) ? selectedDirection : directions[0] || 'Default';
  const gridData = directionsMap[activeDirection] || {};

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header & Direction Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-800">Dynamic Strip Chart (100m Resolution)</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visual inspection density across chainage sections for <strong>{summary?.projectName || 'Project'}</strong>
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
        <span className="font-semibold text-gray-700">Legend:</span>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm inline-block" />
          <span>Good / Pass</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-rose-500 shadow-sm inline-block" />
          <span>Issue Identified (Score 1 or 5)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200 inline-block" />
          <span>No Data / Unrated</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-gray-100/90 text-gray-700 font-semibold text-xs border-b border-gray-200">
              <th className="px-3 py-2.5 w-28 text-left bg-gray-100 sticky left-0 z-10 border-r border-gray-200 shadow-sm">
                Chainage (km)
              </th>
              {cols.map((col) => (
                <th key={col} className="px-2 py-2.5 text-[11px] font-medium text-gray-600 border-r border-gray-200 last:border-r-0 min-w-[55px]">
                  {col}m
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs">
            {rows.map((rowKey) => {
              const rowData = gridData[rowKey] || {};
              return (
                <tr key={rowKey} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-3 py-2 text-left font-bold text-gray-700 bg-gray-50/90 sticky left-0 z-10 border-r border-gray-200 font-mono text-[11px]">
                    KM {rowKey}
                  </td>
                  {cols.map((col) => {
                    const cell = rowData[col];
                    const isIssue = cell?.status === 'Issue';
                    const isGood = cell && cell.status !== 'Issue';

                    return (
                      <td
                        key={col}
                        className="p-1 border-r border-gray-200 last:border-r-0 relative group"
                        onMouseEnter={() => cell && setHoveredCell({ rowKey, col, ...cell })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`w-full h-7 rounded-md flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer ${
                            isIssue
                              ? 'bg-rose-500 text-white shadow-sm hover:scale-105 hover:bg-rose-600'
                              : isGood
                              ? 'bg-emerald-500 text-white shadow-sm hover:scale-105 hover:bg-emerald-600'
                              : 'bg-gray-50 text-transparent border border-dashed border-gray-200'
                          }`}
                        >
                          {isIssue ? cell.issues : isGood ? '✓' : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hover Information Box */}
      {hoveredCell && (
        <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg border border-indigo-800 space-y-2 text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-indigo-700 pb-2">
            <span className="font-bold text-indigo-200">
              KM {hoveredCell.rowKey} + {hoveredCell.col}m ({activeDirection})
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                hoveredCell.status === 'Issue' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {hoveredCell.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-indigo-100">
            <div>
              <span className="text-indigo-400 block text-[10px] uppercase">Issues Count</span>
              <span className="font-bold text-sm">{hoveredCell.issues || 0}</span>
            </div>
            <div>
              <span className="text-indigo-400 block text-[10px] uppercase">Good Assets</span>
              <span className="font-bold text-sm">{hoveredCell.good || 0}</span>
            </div>
            <div>
              <span className="text-indigo-400 block text-[10px] uppercase">Asset Types</span>
              <span className="font-semibold truncate block">
                {hoveredCell.assetTypes?.join(', ') || 'N/A'}
              </span>
            </div>
          </div>

          {hoveredCell.issuesList && hoveredCell.issuesList.length > 0 && (
            <div className="pt-2 border-t border-indigo-800">
              <span className="text-indigo-400 text-[10px] uppercase block mb-1">Issue Details</span>
              <div className="flex flex-wrap gap-1.5">
                {hoveredCell.issuesList.slice(0, 5).map((issue, idx) => (
                  <span key={idx} className="bg-indigo-800/80 px-2 py-1 rounded text-[11px] border border-indigo-700">
                    {issue.assetType}: {issue.parameter} (KM {issue.chainage?.toFixed(3)})
                  </span>
                ))}
                {hoveredCell.issuesList.length > 5 && (
                  <span className="text-indigo-300 self-center text-[11px]">
                    +{hoveredCell.issuesList.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicStripChart;
