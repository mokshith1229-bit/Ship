import React from 'react';

const CategoryTab = ({ categoryPerformance }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Category Performance Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Category Performance</h2>
        </div>
        <div className="flex-1 p-6">
          {categoryPerformance.length === 0 ? (
            <p className="text-gray-400 text-sm">No category data available.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                <div className="col-span-1">Category</div>
                <div className="col-span-1 text-center">Avg Rating</div>
                <div className="col-span-1 text-center">Total Ratings</div>
                <div className="col-span-1 text-right">Completion</div>
              </div>
              {categoryPerformance.map(cat => (
                <div key={cat.category} className="grid grid-cols-4 items-center text-sm font-bold text-gray-800 group">
                  <div className="col-span-1 truncate pr-2 group-hover:text-green-600 transition-colors">{cat.category}</div>
                  <div className="col-span-1 flex items-center justify-center gap-2">
                    {cat.avgRating}
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(cat.avgRating / 10) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="col-span-1 text-center text-gray-500 font-medium">{cat.totalRatings.toLocaleString()}</div>
                  <div className="col-span-1 text-right text-gray-500 font-medium">{cat.completion}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Ranking Cards */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Category Ranking</h2>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
          
          {categoryPerformance.length >= 3 ? (
            <div className="flex items-end justify-center gap-4 h-48 w-full max-w-md mx-auto mb-8">
              {/* Rank 2 */}
              <div className="flex flex-col items-center">
                <div className="text-gray-500 font-bold text-sm mb-1">{categoryPerformance[1].category.substring(0,6)}</div>
                <div className="w-20 h-28 bg-gray-100 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-gray-300">
                  <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold mb-2">2</span>
                  <span className="font-black text-gray-800">{categoryPerformance[1].avgRating}</span>
                </div>
              </div>
              
              {/* Rank 1 */}
              <div className="flex flex-col items-center">
                <div className="text-amber-500 font-bold text-sm mb-1">{categoryPerformance[0].category.substring(0,6)}</div>
                <div className="w-24 h-36 bg-amber-50 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-amber-400 shadow-md z-10 relative">
                  <div className="absolute -top-6 text-2xl">👑</div>
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold mb-2 mt-2">1</span>
                  <span className="font-black text-gray-900 text-lg">{categoryPerformance[0].avgRating}</span>
                </div>
              </div>
              
              {/* Rank 3 */}
              <div className="flex flex-col items-center">
                <div className="text-orange-700 font-bold text-sm mb-1">{categoryPerformance[2].category.substring(0,6)}</div>
                <div className="w-20 h-24 bg-orange-50 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-orange-300">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold mb-2">3</span>
                  <span className="font-black text-gray-800">{categoryPerformance[2].avgRating}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Not enough data for podium</div>
          )}

          {/* Remaining Ranks List */}
          {categoryPerformance.length > 3 && (
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              {categoryPerformance.slice(3, 7).map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold w-4">{index + 4}</span>
                    <span className="text-sm font-bold text-gray-700 truncate max-w-[100px]">{cat.category}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">{cat.avgRating}</span>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
};

export default CategoryTab;
