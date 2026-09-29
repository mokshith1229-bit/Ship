import React from 'react';

const RatingProfile = ({ data, totalAudits }) => {
  if (!data || data.length === 0) return null;

  const profileMap = new Map(data.map(d => [d.rating, d.count]));
  const ratings = [10, 5, 1];
  
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Rating Profile</h2>
        <p className="text-sm text-gray-500">Distribution of worst scores across all audit records</p>
      </div>
      
      <div className="flex-1 flex flex-col justify-between gap-2">
        {ratings.map(rating => {
          const count = profileMap.get(rating) || 0;
          const percentage = totalAudits > 0 ? ((count / totalAudits) * 100).toFixed(1) : 0;
          const width = maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%';
          
          let colorClass = 'bg-gray-200';
          if (rating === 1) colorClass = 'bg-red-500';
          else if (rating <= 5) colorClass = 'bg-amber-400';
          else if (rating === 10) colorClass = 'bg-blue-500';
          else colorClass = 'bg-emerald-400';
          
          return (
            <div key={rating} className="flex items-center gap-4 text-sm group">
              <div className="w-16 font-bold text-gray-600 text-right">Rating {rating}</div>
              <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden flex items-center relative">
                <div 
                  className={`h-full ${colorClass} transition-all duration-500`} 
                  style={{ width: width === '0%' ? '0px' : width }}
                />
              </div>
              <div className="w-24 text-right flex flex-col leading-none">
                <span className="font-bold text-gray-800">{count.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 font-medium">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingProfile;
