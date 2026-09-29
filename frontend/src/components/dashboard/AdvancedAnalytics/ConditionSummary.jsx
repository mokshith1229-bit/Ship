import React from 'react';

const ConditionCard = ({ title, rating, count, percentage, color }) => {
  const colorMap = {
    red: { dot: 'bg-red-500', border: 'border-l-red-500', title: 'text-red-700' },
    amber: { dot: 'bg-amber-500', border: 'border-l-amber-500', title: 'text-amber-700' },
    blue: { dot: 'bg-blue-500', border: 'border-l-blue-500', title: 'text-blue-700' }
  };
  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white border border-gray-200 shadow-sm rounded-lg p-5 border-l-4 ${style.border} h-full flex flex-col justify-between`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${style.dot}`}></div>
          <h3 className={`font-bold text-sm uppercase tracking-wide ${style.title}`}>{title}</h3>
        </div>
        <div className="mb-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating {rating}</span>
        </div>
      </div>
      
      <div>
        <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1">{count.toLocaleString()}</div>
        <div className="text-xs font-bold text-gray-600 mb-4">{title} Audits</div>
        
        <div className="text-xl font-bold text-gray-800 leading-none mb-1">{percentage}%</div>
        <div className="text-xs font-medium text-gray-500">of Total Audits</div>
      </div>
    </div>
  );
};

const ConditionSummary = ({ data, totalAudits }) => {
  if (!data || data.length === 0) return null;

  const getPercentage = (value) => {
    return totalAudits > 0 ? ((value / totalAudits) * 100).toFixed(1) : '0.0';
  };

  const critical = data.find(d => d.name === 'Critical') || { value: 0 };
  const attention = data.find(d => d.name === 'Needs Attention') || { value: 0 };
  const excellent = data.find(d => d.name === 'Excellent') || { value: 0 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <ConditionCard
        title="Critical"
        rating="1"
        count={critical.value}
        percentage={getPercentage(critical.value)}
        color="red"
      />
      <ConditionCard
        title="Needs Attention"
        rating="5"
        count={attention.value}
        percentage={getPercentage(attention.value)}
        color="amber"
      />
      <ConditionCard
        title="Excellent"
        rating="10"
        count={excellent.value}
        percentage={getPercentage(excellent.value)}
        color="blue"
      />
    </div>
  );
};

export default ConditionSummary;
