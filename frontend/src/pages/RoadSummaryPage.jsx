import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MdClear, MdOutlineFileDownload } from 'react-icons/md';
import Pagination from '../components/Pagination';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SegmentedFilters from '../components/Rating/SegmentedFilters';
import CustomDropdown from '../components/common/CustomDropdown';
import { ratingService } from '../services/rating.service';
import { masterListService } from '../services/masterList.service';
import { inspectionEngineService } from '../services/inspectionEngine.service';

const formatVersionLabel = (batch) => {
  if (!batch) return '';
  const dateObj = new Date(batch.createdAt);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-GB', { month: 'short' });
  const dateStr = `${day} ${month}`;
  return `${dateStr} - ${batch.name}`;
};

const RoadSummaryPage = () => {
  const { roadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [direction, setDirection] = useState('Choose Direction');
  const [roadType, setRoadType] = useState('Choose Road Type');
  const [paramType, setParamType] = useState('Choose');
  const [minChainage, setMinChainage] = useState('');
  const [maxChainage, setMaxChainage] = useState('');
  const [concernedItems, setConcernedItems] = useState(false);
  const [activeTab, setActiveTab] = useState('RATING POINTS');

  const tabsFilters = [
    { id: 'RATING POINTS', label: 'RATING POINTS' },
    { id: 'RATING SUMMARY', label: 'RATING SUMMARY' },
    { id: 'RATING VERSION HISTORY', label: 'RATING VERSION HISTORY' },
    { id: 'RATING CHAINAGES', label: 'RATING CHAINAGES' },
    { id: 'ROAD DETAILS', label: 'ROAD DETAILS' },
    { id: 'ROAD HISTORY', label: 'ROAD HISTORY' }
  ];
  
  const [appliedFilters, setAppliedFilters] = useState({
    category: 'All',
    minChainage: '',
    maxChainage: '',
    direction: 'Choose Direction',
    roadType: 'Choose Road Type',
    paramType: 'Choose',
    concernedItems: false,
  });
  
  const [version, setVersion] = useState('Choose');
  const [allBatches, setAllBatches] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeBatchId, setActiveBatchId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const loadBatchTasks = async (batchId, page = 1, filters = appliedFilters) => {
    try {
      setLoading(true);
      const cleanBatchId = (batchId?._id || batchId?.id || batchId || '').toString();
      if (!cleanBatchId) {
        setQuestions([]);
        setTotalPages(1);
        return;
      }
      
      const queryParams = {
        page,
        limit: 10
      };
      if (filters?.category && filters.category !== 'All') queryParams.category = filters.category;
      if (filters?.direction && filters.direction !== 'Choose Direction' && filters.direction !== 'All') queryParams.direction = filters.direction;
      if (filters?.roadType && filters.roadType !== 'Choose Road Type' && filters.roadType !== 'All') queryParams.roadType = filters.roadType;
      if (filters?.minChainage) queryParams.minChainage = filters.minChainage;
      if (filters?.maxChainage) queryParams.maxChainage = filters.maxChainage;

      const data = await ratingService.getBatchTasks(cleanBatchId, queryParams);
      let fetchedTasks = Array.isArray(data) ? data : (data?.data || []);
      let calculatedTotalPages = 1;

      if (!Array.isArray(fetchedTasks) && fetchedTasks?.tasks) {
        calculatedTotalPages = fetchedTasks.totalPages || Math.ceil((fetchedTasks.total || 0) / 10) || 1;
        fetchedTasks = fetchedTasks.tasks;
      } else if (Array.isArray(fetchedTasks)) {
        calculatedTotalPages = Math.ceil(fetchedTasks.length / 10) || 1;
      }
      
      if (!Array.isArray(fetchedTasks)) {
        fetchedTasks = [];
      }
      
      const tasksAsAssets = fetchedTasks.map((task, localIndex) => {
        const firstParam = task.parameters?.[0] || {};
        const paramCount = Array.isArray(task.parameters) && task.parameters.length > 0
          ? task.parameters.length
          : (Array.isArray(task.ratings) && task.ratings.length > 0 ? task.ratings.length : 8);

        const globalIndex = (page - 1) * 10 + localIndex;

        return {
          _id: (task._id || '').toString(),
          assetId: (task._id || '').toString().slice(-6).toUpperCase(),
          project: task.project || firstParam.project || roadId,
          category: task.category || firstParam.category || '-',
          assetType: task.assetSubType ? `${task.assetType} (${task.assetSubType})` : (task.assetType || firstParam.assetType || '-'),
          chainage: task.chainage,
          parameterCount: paramCount,
          taskGlobalIndex: globalIndex,
          status: task.status,
          createdAt: task.createdAt,
          direction: task.direction || firstParam.direction || '-',
          roadType: task.roadType || firstParam.roadType || '-'
        };
      });
      setQuestions(tasksAsAssets);
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error('Error loading batch tasks:', err);
      setQuestions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadVersionHistory = async () => {
      if (!roadId) return;
      try {
        setLoading(true);
        const res = await ratingService.getVersionHistory(roadId);
        const batches = Array.isArray(res) ? res : (res?.data || []);
        batches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllBatches(batches);

        if (batches.length > 0) {
          const latestBatch = batches[0];
          const bId = (latestBatch._id || latestBatch.id || latestBatch).toString();
          setActiveBatchId(bId);
          setVersion(formatVersionLabel(latestBatch));
          await loadBatchTasks(bId, 1, appliedFilters);
        } else {
          setQuestions([]);
          setTotalPages(1);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching version history batches:', err);
        setQuestions([]);
        setTotalPages(1);
        setLoading(false);
      }
    };

    loadVersionHistory();
  }, [roadId]);

  useEffect(() => {
    if (version !== 'Choose' && allBatches.length > 0) {
      const selectedBatch = allBatches.find(b => 
        formatVersionLabel(b) === version || (b._id || b.id || '').toString() === version || b.name === version
      );
      if (selectedBatch) {
        const selectedId = (selectedBatch._id || selectedBatch.id || '').toString();
        if (selectedId !== activeBatchId) {
          setActiveBatchId(selectedId);
          setCurrentPage(1);
          loadBatchTasks(selectedId, 1, appliedFilters);
        }
      }
    }
  }, [version, allBatches, activeBatchId]);

  const currentItems = questions;
  
  const handleGetRatings = () => {
    const newFilters = {
      category: selectedCategory,
      minChainage,
      maxChainage,
      direction,
      roadType,
      paramType,
      concernedItems,
    };
    setAppliedFilters(newFilters);
    setCurrentPage(1);
    if (activeBatchId) {
      loadBatchTasks(activeBatchId, 1, newFilters);
    }
  };
  
  const handleExportCSV = async () => {
    try {
      const response = await ratingService.exportRatingsCSV(roadId);
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ratings_Export_${roadId}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to export CSV');
    }
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded shadow-sm border border-borderColor flex flex-col min-h-full overflow-hidden">
            
            {/* Top Tabs */}
            <div className="flex p-4 border-b border-borderColor overflow-x-auto shrink-0">
              <SegmentedFilters 
                filters={tabsFilters} 
                activeFilter={activeTab} 
                onFilterChange={setActiveTab} 
              />
            </div>

      <div className="p-6 flex flex-col flex-1 overflow-hidden">
        {/* Filters */}
        <div className="grid grid-cols-6 gap-4 mb-6 shrink-0">
          <div>
            <label htmlFor="filter-category" className="block text-xs font-medium text-gray-700 mb-1">Category :</label>
            <CustomDropdown
              id="filter-category"
              options={[
                'All',
                'Roadway',
                'Road Signage and Furniture',
                'Project Facilities',
                'Structures',
                'ATMS',
                'TMS',
                'Landscaping'
              ]}
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
                const updated = { ...appliedFilters, category: val };
                setAppliedFilters(updated);
                if (activeBatchId) {
                  loadBatchTasks(activeBatchId, 1, updated);
                }
              }}
              placeholder="Category"
            />
          </div>
          <div>
            <label htmlFor="filter-min-chainage" className="block text-xs font-medium text-gray-700 mb-1">Min Chainage :</label>
            <input id="filter-min-chainage" name="minChainage" type="text" value={minChainage} onChange={(e) => setMinChainage(e.target.value)} placeholder="Enter Chainage" className="w-full border border-[#5cb85c] rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#5cb85c] focus:ring-2 focus:ring-[#5cb85c]/20 transition-all" />
          </div>
          <div>
            <label htmlFor="filter-max-chainage" className="block text-xs font-medium text-gray-700 mb-1">Max Chainage :</label>
            <input id="filter-max-chainage" name="maxChainage" type="text" value={maxChainage} onChange={(e) => setMaxChainage(e.target.value)} placeholder="Enter Chainage" className="w-full border border-[#5cb85c] rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#5cb85c] focus:ring-2 focus:ring-[#5cb85c]/20 transition-all" />
          </div>
          <div>
            <label htmlFor="filter-direction" className="block text-xs font-medium text-gray-700 mb-1">Direction :</label>
            <CustomDropdown
              id="filter-direction"
              options={['Choose Direction', 'All', 'LHS', 'RHS']}
              value={direction}
              onChange={setDirection}
              placeholder="Direction"
            />
          </div>
          <div>
            <label htmlFor="filter-road-type" className="block text-xs font-medium text-gray-700 mb-1">Road Type :</label>
            <CustomDropdown
              id="filter-road-type"
              options={['Choose Road Type', 'All', 'SR', 'MCW']}
              value={roadType}
              onChange={setRoadType}
              placeholder="Road Type"
            />
          </div>
          <div>
            <label htmlFor="filter-param-type" className="block text-xs font-medium text-gray-700 mb-1">Parameter Type :</label>
            <CustomDropdown
              id="filter-param-type"
              options={['Choose', 'Conventional', 'Digital', 'Both']}
              value={paramType}
              onChange={setParamType}
              placeholder="Parameter Type"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-end justify-center gap-6 mb-6 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <input type="checkbox" id="concerned" checked={concernedItems} onChange={(e) => setConcernedItems(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#5cb85c] focus:ring-[#5cb85c] accent-[#5cb85c]" />
            <label htmlFor="concerned" className="text-sm font-medium text-gray-700">Concerned Items</label>
          </div>
          
          <div className="min-w-[220px]">
            <label htmlFor="filter-version" className="block text-xs font-medium text-gray-700 mb-1 text-center">Version:</label>
            <CustomDropdown
              id="filter-version"
              options={allBatches.length > 0 ? allBatches.map(formatVersionLabel) : ['Choose']}
              value={version}
              onChange={setVersion}
              placeholder="Version"
            />
          </div>
          
          <button onClick={handleGetRatings} className="bg-[#5cb85c] hover:bg-green-600 text-white font-medium py-1.5 px-6 rounded text-sm transition-colors mb-0.5">
            Get Ratings
          </button>
          
          <button onClick={handleExportCSV} className="flex items-center gap-2 border-2 border-[#5cb85c] text-[#5cb85c] hover:bg-green-50 font-medium py-1.5 px-4 rounded text-sm transition-colors mb-0.5">
            <MdOutlineFileDownload className="text-lg" />
            Generate CSV
          </button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto min-h-0 border-t border-[#5cb85c]/40">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#5cb85c] uppercase bg-green-50/50 sticky top-0 border-b border-[#5cb85c]/40">
              <tr>
                <th className="px-4 py-3 font-medium">ASSET ID</th>
                <th className="px-4 py-3 font-medium">PROJECT</th>
                <th className="px-4 py-3 font-medium">CATEGORY</th>
                <th className="px-4 py-3 font-medium">ASSET TYPE</th>
                <th className="px-4 py-3 font-medium">CHAINAGE</th>
                <th className="px-4 py-3 font-medium">PARAMETERS</th>
                <th className="px-4 py-3 font-medium text-center">STATUS</th>
                <th className="px-4 py-3 font-medium">CREATED</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8">Loading...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">No rating records found for this version/filter.</td></tr>
              ) : currentItems.map((q, index) => {
                return (
                <tr 
                  key={index} 
                  onClick={() => {
                    if (!activeBatchId) {
                      alert('No active inspection batch found for this project.');
                      return;
                    }
                    if (q.taskGlobalIndex === -1) {
                      alert('This asset is not part of the current active inspection batch.');
                      return;
                    }
                    const cleanBatchId = (activeBatchId?._id || activeBatchId?.id || activeBatchId || '').toString();
                    const selectedBatchObj = allBatches.find(b => (b._id || b.id || '').toString() === cleanBatchId);
                    const isCompleted = selectedBatchObj?.status === 'COMPLETED' || selectedBatchObj?.status === 'Completed' || q.status === 'COMPLETED' || q.status === 'SKIPPED' || q.status === 'FAILED';
                    const basePath = location.pathname.startsWith('/rating-v2') ? '/rating-v2/inspector' : '/rating/inspector';
                    const reviewQuery = isCompleted ? '&mode=review' : '';
                    navigate(`${basePath}/${cleanBatchId}?startIndex=${q.taskGlobalIndex}${reviewQuery}`, { state: { roadId } });
                  }}
                  className={`border-b border-[#5cb85c]/20 hover:bg-green-50/50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-[#5cb85c]/[0.02]'}`}
                >
                  <td className="px-4 py-3 text-gray-900 font-medium">{q.assetId}</td>
                  <td className="px-4 py-3 text-gray-600">{q.project}</td>
                  <td className="px-4 py-3 text-gray-600">{q.category}</td>
                  <td className="px-4 py-3 text-gray-600">{q.assetType}</td>
                  <td className="px-4 py-3 text-gray-600">{q.chainage}</td>
                  <td className="px-4 py-3 text-gray-600">{q.parameterCount} Params</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded ${
                      q.status === 'COMPLETED' || q.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      q.status === 'SKIPPED' ? 'bg-blue-100 text-blue-700' :
                      q.status === 'FAILED' || q.status === 'Failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{q.createdAt && !isNaN(new Date(q.createdAt).getTime()) ? new Date(q.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination at bottom */}
        <div className="shrink-0 pt-4 border-t border-borderColor -mx-6">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={(page) => {
                setCurrentPage(page);
                if (activeBatchId) {
                  loadBatchTasks(activeBatchId, page, appliedFilters);
                }
              }} 
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
  );
};

export default RoadSummaryPage;

