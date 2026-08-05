import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSkipNext, MdInfoOutline, MdWarning, MdFilterList, MdClose, MdImage, MdPerson, MdCalendarToday, MdOutlineLocationOn } from 'react-icons/md';
import { dashboardService } from '../../services/dashboard.service';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SkipAnalytics = ({ selectedProject }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Filters State
  const [filters, setFilters] = useState({
    reason: '',
    inspector: '',
    assetType: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedProject, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSkipAnalytics(selectedProject, filters);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch skip analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      reason: '',
      inspector: '',
      assetType: '',
      startDate: '',
      endDate: ''
    });
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#5cb85c] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4 font-medium tracking-wide">Crunching Analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  // Executive KPIs
  const projectsAffected = data.projectCounts?.length || 0;
  const topReason = data.reasonDistribution?.length > 0 ? data.reasonDistribution[0].reason : 'N/A';

  // 3. Skip Reason Distribution (Horizontal Bar)
  const reasonChartData = {
    labels: data.reasonDistribution.map(r => r.reason),
    datasets: [{
      label: 'Skips',
      data: data.reasonDistribution.map(r => r.count),
      backgroundColor: 'rgba(92, 184, 92, 0.8)',
      borderRadius: 4,
    }]
  };
  const reasonChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } }
  };

  // 4. Project-wise Skips (Vertical Bar)
  const projectChartData = {
    labels: data.projectCounts.map(p => p.project),
    datasets: [{
      label: 'Skips',
      data: data.projectCounts.map(p => p.count),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderRadius: 4,
    }]
  };
  const projectChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  // 5. Chainage Hotspot (Scatter)
  const hotspotData = {
    datasets: [{
      label: 'Skip Clusters',
      data: data.chainageHotspots || [],
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };
  const hotspotOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Chainage: ${ctx.raw.x}, Skips: ${ctx.raw.y}`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Chainage' } },
      y: { title: { display: true, text: 'Skip Count' }, beginAtZero: true }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <MdSkipNext className="text-[#5cb85c] text-2xl" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg">Skip Analytics Dashboard</h3>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${showFilters ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
        >
          <MdFilterList className="text-lg" />
          Filters {Object.values(filters).some(x => x) && <span className="w-2 h-2 rounded-full bg-[#5cb85c]"></span>}
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gray-50 border-b border-gray-100"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Skip Reason</label>
                <select name="reason" value={filters.reason} onChange={handleFilterChange} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#5cb85c] focus:border-[#5cb85c]">
                  <option value="">All Reasons</option>
                  {data.reasonDistribution.map(r => <option key={r.reason} value={r.reason}>{r.reason}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Start Date</label>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#5cb85c] focus:border-[#5cb85c]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">End Date</label>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#5cb85c] focus:border-[#5cb85c]" />
              </div>
              <div className="lg:col-span-2 flex items-end justify-end">
                <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-500 font-medium px-4 py-2 transition-colors">Clear Filters</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#5cb85c] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 1. Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <p className="text-gray-500 text-sm font-medium mb-2 relative z-10">Total Skipped</p>
            <h4 className="text-3xl font-bold text-gray-900 relative z-10">{data.totalSkipped}</h4>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <p className="text-gray-500 text-sm font-medium mb-2 relative z-10">Avg Skip Rate</p>
            <h4 className="text-3xl font-bold text-gray-900 relative z-10">{data.skipRate}%</h4>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <p className="text-gray-500 text-sm font-medium mb-2 relative z-10">Projects Affected</p>
            <h4 className="text-3xl font-bold text-gray-900 relative z-10">{projectsAffected}</h4>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <p className="text-gray-500 text-sm font-medium mb-2 relative z-10">Top Reason</p>
            <h4 className="text-lg font-bold text-gray-900 relative z-10 truncate" title={topReason}>{topReason}</h4>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Skip Reason Distribution</h4>
            <div className="h-[280px]">
              {data.reasonDistribution.length > 0 ? (
                <Bar data={reasonChartData} options={reasonChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Project-wise Skips</h4>
            <div className="h-[280px]">
              {data.projectCounts.length > 0 ? (
                <Bar data={projectChartData} options={projectChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Chainage Hotspots</h4>
            <div className="h-[300px]">
              {data.chainageHotspots?.length > 0 ? (
                <Scatter data={hotspotData} options={hotspotOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No hotspots available</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Inspector Performance</h4>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {data.inspectorCounts?.map((insp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {insp.inspector.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800 text-sm truncate">{insp.inspector}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-gray-900">{insp.count}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Skips</div>
                    </div>
                  </div>
                ))}
                {(!data.inspectorCounts || data.inspectorCounts.length === 0) && (
                  <div className="text-center text-gray-400 py-10">No inspector data</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Gallery */}
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
          <h4 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider flex items-center gap-2">
            <MdImage className="text-gray-400" /> Recent Skipped Images
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.recentSkips?.map((skip, idx) => (
              <div 
                key={skip._id || idx} 
                className="group relative rounded-lg overflow-hidden border border-gray-200 aspect-[4/3] cursor-pointer bg-gray-100"
                onClick={() => setLightboxImage(skip)}
              >
                {skip.imageUrl ? (
                  <img src={skip.imageUrl} alt="Skipped Asset" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col">
                    <MdImage className="text-3xl mb-1 opacity-50" />
                    <span className="text-xs">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="font-bold text-sm truncate">{skip.reason}</div>
                  <div className="text-xs text-white/80 flex items-center gap-1 mt-1 truncate">
                    <MdOutlineLocationOn /> {skip.chainage || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
            {(!data.recentSkips || data.recentSkips.length === 0) && (
              <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No recent skips found matching the criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full md:w-2/3 bg-black relative min-h-[300px] flex items-center justify-center">
                {lightboxImage.imageUrl ? (
                  <img src={lightboxImage.imageUrl} alt="Skipped" className="max-w-full max-h-[90vh] object-contain" />
                ) : (
                  <div className="text-white/50 flex flex-col items-center">
                    <MdImage className="text-6xl mb-4" />
                    <p>Image not available</p>
                  </div>
                )}
              </div>
              <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col bg-gray-50 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Skip Details</h3>
                  <button onClick={() => setLightboxImage(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                    <MdClose />
                  </button>
                </div>
                
                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Project</p>
                    <p className="text-gray-900 font-medium">{lightboxImage.project || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Chainage</p>
                    <p className="text-gray-900 font-medium">{lightboxImage.chainage || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Asset Type</p>
                    <p className="text-gray-900 font-medium">{lightboxImage.assetType || 'N/A'}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Skip Reason</p>
                    <p className="text-red-900 font-bold">{lightboxImage.reason}</p>
                    {lightboxImage.remarks && (
                      <p className="text-red-700 text-sm mt-2 pt-2 border-t border-red-100">"{lightboxImage.remarks}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {lightboxImage.inspector?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skipped By</p>
                      <p className="text-gray-900 font-medium">{lightboxImage.inspector}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Timestamp</p>
                    <p className="text-gray-600 text-sm">{new Date(lightboxImage.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SkipAnalytics;
