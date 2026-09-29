import React from 'react';
import { MdMap, MdFactCheck, MdOutlineInventory2 } from 'react-icons/md';

const InspectionCoverage = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Inspection Coverage</h2>
        <p className="text-sm text-gray-500">How much of the inspection scope has been assessed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <MdFactCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Audits</div>
            <div className="text-2xl font-extrabold text-gray-800">{data.totalAudits?.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <MdMap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Completed</div>
            <div className="text-2xl font-extrabold text-gray-800">{data.completedInspections?.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <MdOutlineInventory2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assets Assessed</div>
            <div className="text-2xl font-extrabold text-gray-800">{data.assetsAssessed?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Overall Completion</span>
          <span className="text-xl font-extrabold text-blue-600">{data.completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${data.completionRate}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }}></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
          <span>{data.completedInspections?.toLocaleString()} Completed</span>
          <span>{data.pendingInspections?.toLocaleString()} Pending</span>
        </div>
      </div>
    </div>
  );
};

export default InspectionCoverage;
