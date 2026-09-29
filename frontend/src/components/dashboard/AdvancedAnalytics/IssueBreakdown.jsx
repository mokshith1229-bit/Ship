import React from 'react';

const IssueBreakdown = ({ data, selectedIssue, onSelectIssue }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Issue Breakdown</h2>
        <p className="text-sm text-gray-500">Defect types ranked by affected records</p>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
        <div className="flex flex-col gap-3">
          {data.slice(0, 20).map((item, idx) => {
            const isSelected = selectedIssue === item.issue;
            return (
              <div 
                key={idx}
                onClick={() => onSelectIssue(isSelected ? null : item.issue)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight pr-4">{item.issue}</h4>
                  <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 shrink-0">
                    {item.criticalAudits.toLocaleString()} Critical
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <span>{item.issueCount.toLocaleString()} affected audits</span>
                  <span>•</span>
                  <span>{item.criticalRate}% critical rate</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IssueBreakdown;
