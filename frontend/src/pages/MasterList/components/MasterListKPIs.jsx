import React from 'react';
import { MdOutlineLibraryBooks, MdOutlineBusiness, MdOutlineCategory, MdOutlineLayers, MdOutlineAnalytics, MdMoreVert } from 'react-icons/md';

const MasterListKPIs = ({ stats }) => {
  const kpis = [
    { 
      title: 'Total Questions', 
      value: stats?.totalQuestions || 0, 
      icon: MdOutlineLibraryBooks, 
      color: 'text-[#4F46E5]', // Indigo
      bg: 'bg-[#EEF2FF]', 
      status: 'Total'
    },
    { 
      title: 'Projects', 
      value: stats?.totalProjects || 0, 
      icon: MdOutlineBusiness, 
      color: 'text-[#0284C7]', // Blue
      bg: 'bg-[#F0F9FF]', 
      status: 'Active'
    },
    { 
      title: 'Categories', 
      value: stats?.totalCategories || 0, 
      icon: MdOutlineCategory, 
      color: 'text-[#7C3AED]', // Purple
      bg: 'bg-[#F5F3FF]', 
      status: 'Mapped'
    },
    { 
      title: 'Asset Types', 
      value: stats?.totalAssetTypes || 0, 
      icon: MdOutlineLayers, 
      color: 'text-[#D97706]', // Amber
      bg: 'bg-[#FFFBEB]', 
      status: 'Standard'
    },
    { 
      title: 'Parameters', 
      value: stats?.totalParameters || 0, 
      icon: MdOutlineAnalytics, 
      color: 'text-[#DB2777]', // Pink
      bg: 'bg-[#FDF2F8]', 
      status: 'Defined'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div 
            key={idx} 
            className="group relative bg-white rounded-[20px] shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-[#EEF2F7] p-5 flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)] transition-all duration-300 cursor-pointer"
          >
            {/* Top Right Menu */}
            <div className="absolute top-4 right-4 text-gray-400 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <MdMoreVert className="text-lg hover:text-gray-600" />
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-center justify-center w-full">
              <span className="text-[14px] font-medium text-[#64748B] mb-0.5 font-sans tracking-wide">
                {kpi.title}
              </span>
              <span className="text-[32px] font-bold text-[#0F172A] leading-none mb-1.5 font-sans tracking-tight">
                {kpi.value.toLocaleString()}
              </span>
              
              {/* Status Label */}
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${kpi.bg.replace('bg-', 'bg-').replace('50', '500')}`} style={{ backgroundColor: 'currentColor' }}>
                  <div className={`w-full h-full rounded-full ${kpi.color.replace('text-', 'bg-')}`}></div>
                </div>
                <span className="text-[13px] text-[#64748B] font-sans">
                  {kpi.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MasterListKPIs;
