import React from 'react';
import { MdLightbulbOutline } from 'react-icons/md';

const KeyFindings = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
          <MdLightbulbOutline className="text-amber-500 w-5 h-5" />
          Key Findings
        </h2>
        <p className="text-sm text-gray-500">Automated insights from the inspection dataset</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {data.map((finding, idx) => (
          <div key={idx} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
            <div className="text-lg font-extrabold text-indigo-900 leading-tight mb-1">
              {finding.number}
            </div>
            <div className="text-sm font-bold text-gray-800 mb-1">
              {finding.finding}
            </div>
            <div className="text-xs font-medium text-gray-500">
              {finding.explanation}
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-sm text-gray-500 italic text-center">
            Not enough data to generate findings.
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyFindings;
