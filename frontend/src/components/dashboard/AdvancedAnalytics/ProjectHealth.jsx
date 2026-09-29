import React from 'react';
import { MdAssignment, MdWarning, MdTrendingDown, MdStarRate, MdCheckCircle, MdPendingActions } from 'react-icons/md';

const HealthCard = ({ label, value, icon: Icon, color, description }) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border shadow-sm p-5 bg-white flex flex-col justify-between hover:shadow-md transition-shadow h-full`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${style.replace('text-', 'text-').replace('bg-', 'bg-').split(' ')[0]} ${style.split(' ')[1]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-gray-900 leading-tight">{value}</div>
        {description && <div className="text-xs text-gray-400 mt-2 font-medium">{description}</div>}
      </div>
    </div>
  );
};

const ProjectHealth = ({ data, coverageData }) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Project Health</h2>
        <p className="text-sm text-gray-500">Current inspection condition and criticality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <HealthCard 
          label="Total Audits" 
          value={coverageData?.totalAudits?.toLocaleString() || 0} 
          icon={MdAssignment} 
          color="blue"
          description="All inspection records"
        />
        <HealthCard 
          label="Completed" 
          value={coverageData?.completedInspections?.toLocaleString() || 0} 
          icon={MdCheckCircle} 
          color="green"
          description="Rated inspections"
        />
        <HealthCard 
          label="Pending" 
          value={coverageData?.pendingInspections?.toLocaleString() || 0} 
          icon={MdPendingActions} 
          color="amber"
          description="Awaiting rating"
        />
        <HealthCard 
          label="Critical Audits" 
          value={data.criticalAudits?.toLocaleString() || 0} 
          icon={MdWarning} 
          color="red"
          description="Records requiring attention"
        />
        <HealthCard 
          label="Critical Rate" 
          value={`${data.criticalRate || 0}%`} 
          icon={MdTrendingDown} 
          color="red"
          description="Critical / Total Audits"
        />
        <HealthCard 
          label="Avg Rating" 
          value={data.avgRating || 0} 
          icon={MdStarRate} 
          color="indigo"
          description="Overall health score"
        />
      </div>
    </div>
  );
};

export default ProjectHealth;
