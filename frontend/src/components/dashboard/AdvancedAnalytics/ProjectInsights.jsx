import React from 'react';

const InsightCard = ({ number, title, subtitle, color = 'blue' }) => {
  const colors = {
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    green: 'border-l-emerald-500',
    purple: 'border-l-purple-500'
  };
  
  return (
    <div className={`bg-gray-50 border border-gray-100 rounded-lg p-5 border-l-4 ${colors[color] || colors.blue}`}>
      <div className="text-3xl font-extrabold text-gray-800 mb-1 leading-none">{number}</div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-sm font-medium text-gray-700">{subtitle}</div>
    </div>
  );
};

const ProjectInsights = ({ data }) => {
  if (!data) return null;

  const { assetPerformance, issueIntelligence, criticalLocations, projectHealth } = data;

  // 1. Highest Critical Asset
  const highestCriticalAsset = assetPerformance?.length > 0 
    ? [...assetPerformance].sort((a, b) => b.criticalAudits - a.criticalAudits)[0] 
    : null;

  // 2. Most Frequent Issue
  const mostFrequentIssue = issueIntelligence?.length > 0
    ? [...issueIntelligence].sort((a, b) => b.issueCount - a.issueCount)[0]
    : null;

  // 3. Highest Critical Location
  const highestCriticalLocation = criticalLocations?.length > 0
    ? [...criticalLocations].sort((a, b) => b.criticalAudits - a.criticalAudits)[0]
    : null;

  // 4. Lowest Recorded Rating
  // Since we don't have individual ratings, we can show highest critical rate asset
  const highestCriticalRateAsset = assetPerformance?.length > 0
    ? [...assetPerformance].sort((a, b) => parseFloat(b.criticalRate) - parseFloat(a.criticalRate))[0]
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Project Insights</h2>
        <p className="text-sm text-gray-500">Key factual findings from the selected project</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {highestCriticalAsset && highestCriticalAsset.criticalAudits > 0 ? (
          <InsightCard 
            number={highestCriticalAsset.criticalAudits?.toLocaleString()}
            title="Critical Audits"
            subtitle={`Highest in ${highestCriticalAsset.assetType}`}
            color="red"
          />
        ) : (
          <InsightCard 
            number="0"
            title="Critical Audits"
            subtitle="No critical assets found"
            color="green"
          />
        )}

        {mostFrequentIssue ? (
          <InsightCard 
            number={mostFrequentIssue.issueCount?.toLocaleString()}
            title="Most Frequent Issue"
            subtitle={mostFrequentIssue.issue}
            color="amber"
          />
        ) : (
          <InsightCard 
            number="N/A"
            title="Most Frequent Issue"
            subtitle="No issue data available"
            color="blue"
          />
        )}

        {highestCriticalLocation && highestCriticalLocation.criticalAudits > 0 ? (
          <InsightCard 
            number={highestCriticalLocation.criticalAudits?.toLocaleString()}
            title="Critical Audits"
            subtitle={`At chainage ${highestCriticalLocation.chainage} km`}
            color="purple"
          />
        ) : (
          <InsightCard 
            number="N/A"
            title="Critical Locations"
            subtitle="No critical locations found"
            color="blue"
          />
        )}

        {highestCriticalRateAsset && parseFloat(highestCriticalRateAsset.criticalRate) > 0 ? (
          <InsightCard 
            number={`${highestCriticalRateAsset.criticalRate}%`}
            title="Highest Critical Rate"
            subtitle={highestCriticalRateAsset.assetType}
            color="red"
          />
        ) : (
          <InsightCard 
            number={`${projectHealth?.criticalRate || 0}%`}
            title="Overall Critical Rate"
            subtitle="Across all assets"
            color="green"
          />
        )}
      </div>
    </div>
  );
};

export default ProjectInsights;
