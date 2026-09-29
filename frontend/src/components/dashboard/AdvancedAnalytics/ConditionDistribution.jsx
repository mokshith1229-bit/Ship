import React from 'react';

const ConditionCard = ({ title, rating, count, percentage, meaning, color, countLabel }) => {
  const colorMap = {
    red: {
      dot: 'bg-red-500',
      border: 'border-l-red-500',
      title: 'text-red-700'
    },
    amber: {
      dot: 'bg-amber-500',
      border: 'border-l-amber-500',
      title: 'text-amber-700'
    },
    blue: {
      dot: 'bg-blue-500',
      border: 'border-l-blue-500',
      title: 'text-blue-700'
    }
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white border border-gray-200 shadow-sm rounded-lg p-5 border-l-4 ${style.border}`}>
      {/* 1. Condition */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${style.dot}`}></div>
        <h3 className={`font-bold text-sm uppercase tracking-wide ${style.title}`}>{title}</h3>
      </div>
      
      {/* 2. Rating */}
      <div className="mb-1">
        <span className="text-sm font-bold text-gray-700">Rating {rating}</span>
      </div>
      
      {/* 3. Meaning */}
      <div className="text-sm font-medium text-gray-500 mb-6 leading-snug">
        {meaning}
      </div>
      
      {/* 4. Count & 5. What it represents */}
      <div className="mb-6">
        <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1">{count.toLocaleString()}</div>
        <div className="text-sm font-bold text-gray-600">{countLabel}</div>
      </div>
      
      {/* 6. Percentage & 7. Percentage context */}
      <div>
        <div className="text-xl font-bold text-gray-800 leading-none mb-1">{percentage}%</div>
        <div className="text-xs font-medium text-gray-500">of Total Audits</div>
      </div>
    </div>
  );
};

const ConditionDistribution = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Calculate total audits that fit these specific 3 categories
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  const getPercentage = (value) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  // Find counts
  const criticalCount = data.find(d => d.name === 'Critical')?.value || 0;
  const attentionCount = data.find(d => d.name === 'Needs Attention')?.value || 0;
  const excellentCount = data.find(d => d.name === 'Excellent')?.value || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Condition Distribution</h2>
          <p className="text-sm text-gray-500">Current inspection rating overview</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Audits</div>
          <div className="text-xl font-extrabold text-gray-700 leading-none">{total.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConditionCard
          title="Critical"
          rating="1"
          count={criticalCount}
          countLabel="Critical Audits"
          percentage={getPercentage(criticalCount)}
          meaning="Immediate attention required"
          color="red"
        />
        
        <ConditionCard
          title="Needs Attention"
          rating="5"
          count={attentionCount}
          countLabel="Needs Attention Audits"
          percentage={getPercentage(attentionCount)}
          meaning="Attention / corrective action needed"
          color="amber"
        />
        
        <ConditionCard
          title="Excellent"
          rating="10"
          count={excellentCount}
          countLabel="Excellent Audits"
          percentage={getPercentage(excellentCount)}
          meaning="Excellent condition"
          color="blue"
        />
      </div>
    </div>
  );
};

export default ConditionDistribution;
