import React from 'react';

const InspectionCompleteness = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col justify-between">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Inspection Completeness</h2>
        <p className="text-sm text-gray-500">Operational progress of the current dataset</p>
      </div>

      <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
        <div>
          <div className="text-2xl font-extrabold text-gray-900 leading-none mb-1">
            {data.totalAudits?.toLocaleString() || 0}
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase">Total Audit Records</div>
        </div>
        
        <div>
          <div className="text-2xl font-extrabold text-emerald-600 leading-none mb-1">
            {data.completedInspections?.toLocaleString() || 0}
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase">Completed</div>
        </div>
        
        <div>
          <div className="text-2xl font-extrabold text-amber-500 leading-none mb-1">
            {data.pendingInspections?.toLocaleString() || 0}
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase">Pending</div>
        </div>
        
        <div>
          <div className="text-2xl font-extrabold text-blue-600 leading-none mb-1">
            {data.assetsAssessed?.toLocaleString() || 0}
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase">Assets Assessed</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-gray-800">Inspection Completion</span>
          <span className="text-xl font-extrabold text-emerald-600">{data.completionRate || 0}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000" 
            style={{ width: `${data.completionRate || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default InspectionCompleteness;
