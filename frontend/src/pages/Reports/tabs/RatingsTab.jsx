import React from 'react';
import { MdStarRate, MdImage, MdTrendingUp } from 'react-icons/md';

const RatingsTab = ({ ratingAnalytics, categoryPerformance, kpi }) => {
  const total = ratingAnalytics.ratings1 + ratingAnalytics.ratings5 + ratingAnalytics.ratings10;
  
  const getPercent = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Ratings Distribution Summary */}
      <div className="lg:col-span-2 bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Ratings Analytics</h2>
        
        <div className="grid grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Images Rated</span>
            <span className="text-4xl font-black text-gray-900">{kpi.imagesRated.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Average Rating</span>
            <span className="text-4xl font-black text-green-600">{kpi.avgRating}<span className="text-xl text-gray-400 ml-1">/10</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Highest Category</span>
            <span className="text-xl font-bold text-gray-800 mt-2">{ratingAnalytics.highestRatedCategory}</span>
          </div>
        </div>

        <div className="space-y-6 flex-1 flex flex-col justify-end">
          {/* 10 Ratings */}
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm font-bold text-gray-600">10 Ratings</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${getPercent(ratingAnalytics.ratings10)}%` }}></div>
            </div>
            <div className="w-32 text-right">
              <span className="text-sm font-bold text-gray-900">{ratingAnalytics.ratings10.toLocaleString()}</span>
              <span className="text-xs font-medium text-gray-400 ml-2">({getPercent(ratingAnalytics.ratings10)}%)</span>
            </div>
          </div>
          
          {/* 5 Ratings */}
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm font-bold text-gray-600">5 Ratings</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${getPercent(ratingAnalytics.ratings5)}%` }}></div>
            </div>
            <div className="w-32 text-right">
              <span className="text-sm font-bold text-gray-900">{ratingAnalytics.ratings5.toLocaleString()}</span>
              <span className="text-xs font-medium text-gray-400 ml-2">({getPercent(ratingAnalytics.ratings5)}%)</span>
            </div>
          </div>

          {/* 1 Ratings */}
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm font-bold text-gray-600">1 Ratings</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${getPercent(ratingAnalytics.ratings1)}%` }}></div>
            </div>
            <div className="w-32 text-right">
              <span className="text-sm font-bold text-gray-900">{ratingAnalytics.ratings1.toLocaleString()}</span>
              <span className="text-xs font-medium text-gray-400 ml-2">({getPercent(ratingAnalytics.ratings1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Cards */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <MdTrendingUp className="text-3xl" />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Rating Trend</h3>
          <p className="text-2xl font-black text-gray-900">Stable</p>
          <p className="text-xs text-gray-500 mt-2">Consistent with last month</p>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <MdStarRate className="text-3xl" />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Lowest Category</h3>
          <p className="text-xl font-bold text-gray-900">{ratingAnalytics.lowestRatedCategory}</p>
          <p className="text-xs text-gray-500 mt-2">Requires immediate attention</p>
        </div>
      </div>

    </div>
  );
};

export default RatingsTab;
