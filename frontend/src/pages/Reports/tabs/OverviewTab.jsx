import React from 'react';
import KPICard from '../KPICard';
import { MdFolder, MdCheckCircle, MdAssignmentTurnedIn, MdOutlineCancel, MdStarRate, MdImage, MdTrendingUp } from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const OverviewTab = ({ kpi, projects }) => {
  const projectData = [
    { name: 'Completed', value: kpi.completedProjects, color: '#16A34A' },
    { name: 'Approved', value: kpi.approvedProjects, color: '#22C55E' },
    { name: 'In Progress', value: kpi.totalProjects - kpi.completedProjects - kpi.approvedProjects - kpi.rejectedProjects, color: '#F59E0B' },
    { name: 'Rejected', value: kpi.rejectedProjects, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Recharts custom label for Gauge
  const renderGaugeLabel = ({ cx, cy }) => (
    <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#111827">
      <tspan x={cx} dy="-0.2em" fontSize="24" fontWeight="900">{kpi.avgRating}</tspan>
      <tspan fontSize="16" fill="#6B7280" fontWeight="bold"> / 10</tspan>
    </text>
  );

  return (
    <div className="space-y-6">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Projects" value={kpi.totalProjects} icon={MdFolder} color="blue" />
        <KPICard title="Completed" value={kpi.completedProjects} icon={MdAssignmentTurnedIn} color="green" />
        <KPICard title="Approved" value={kpi.approvedProjects} icon={MdCheckCircle} color="emerald" />
        <KPICard title="Total Ratings" value={kpi.totalRatings.toLocaleString()} icon={MdStarRate} color="amber" />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Overview Pie Chart */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Projects Overview</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Rating Gauge */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <h3 className="text-sm font-bold text-gray-800 w-full text-left mb-2">Average Rating</h3>
          <div className="relative w-48 h-48 flex items-center justify-center mt-4">
            <svg viewBox="0 0 100 50" className="w-full drop-shadow-md">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F3F4F6" strokeWidth="12" strokeLinecap="round" />
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="#16A34A" 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeDasharray={`${(kpi.avgRating / 10) * 125.6} 125.6`} 
              />
            </svg>
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
              <div className="text-3xl font-black text-gray-900 leading-none">{kpi.avgRating} <span className="text-base text-gray-400 font-bold">/10</span></div>
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1">Excellent</span>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-gray-800 w-full text-left mb-4">Completion Rate</h3>
          
          <div className="w-32 h-32 rounded-full border-[12px] border-gray-100 flex items-center justify-center relative shadow-inner mb-4">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                fill="none"
                stroke="#16A34A"
                strokeWidth="12"
                strokeDasharray={`${(kpi.completionPercent / 100) * 326.7} 326.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-3xl font-black text-gray-900">{kpi.completionPercent}%</span>
          </div>

          <p className="text-sm text-gray-500 font-medium">
            <span className="text-gray-900 font-bold">{kpi.completedProjects + kpi.approvedProjects}</span> of {kpi.totalProjects} Projects Completed
          </p>
        </div>

      </div>
    </div>
  );
};

export default OverviewTab;
