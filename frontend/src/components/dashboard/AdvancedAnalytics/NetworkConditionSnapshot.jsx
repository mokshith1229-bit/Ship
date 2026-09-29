import React from 'react';

const SnapshotCard = ({ label, value, subLabel, highlight }) => (
  <div className="flex flex-col p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</span>
    <div className={`text-3xl font-extrabold leading-tight mb-1 ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
      {value}
    </div>
    <div className="text-xs font-medium text-gray-400 mt-auto">{subLabel}</div>
  </div>
);

const NetworkConditionSnapshot = ({ healthData, coverageData }) => {
  if (!healthData || !coverageData) return null;

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Network Condition Snapshot</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <SnapshotCard 
          label="Total Audit Records" 
          value={coverageData.totalAudits?.toLocaleString() || 0} 
          subLabel="All inspection records" 
        />
        <SnapshotCard 
          label="Critical Audits" 
          value={healthData.criticalAudits?.toLocaleString() || 0} 
          subLabel="Rating 1 records" 
          highlight={healthData.criticalAudits > 0}
        />
        <SnapshotCard 
          label="Critical Rate" 
          value={`${healthData.criticalRate || 0}%`} 
          subLabel="Critical / Total Audits" 
          highlight={healthData.criticalRate > 10}
        />
        <SnapshotCard 
          label="Average Rating" 
          value={healthData.avgRating || 0} 
          subLabel="Current inspection dataset" 
        />
        <SnapshotCard 
          label="Assets Assessed" 
          value={coverageData.assetsAssessed?.toLocaleString() || 0} 
          subLabel="Unique asset classes" 
        />
        <SnapshotCard 
          label="Inspection Completion" 
          value={`${coverageData.completionRate || 0}%`} 
          subLabel={`${coverageData.completedInspections?.toLocaleString() || 0} completed`} 
        />
      </div>
    </div>
  );
};

export default NetworkConditionSnapshot;
