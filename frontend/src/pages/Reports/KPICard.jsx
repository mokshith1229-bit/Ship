import React from 'react';

const KPICard = ({ title, value, subtitle, icon: Icon, color = 'green' }) => {
  return (
    <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-${color}-50 text-${color}-600`}>
        <Icon className="text-2xl" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-gray-900 leading-none">{value}</h3>
          {subtitle && <span className="text-xs font-medium text-gray-500">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
