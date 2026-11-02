import React, { useState, useEffect } from 'react';
import HiRateRoadLoader from '../components/common/HiRateRoadLoader';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { MdClear, MdOutlineFileDownload, MdArrowBack } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const canExport = typeof hasPermission === 'function' ? hasPermission('Rating', 'export') : true;

  const pageQuery = parseInt(searchParams.get('page'), 10);
  const initialPage = React.useMemo(() => {
    if (!isNaN(pageQuery) && pageQuery > 0) return pageQuery;
    const fromState = location.state?.returnPage || location.state?.currentPage;
    if (fromState && !isNaN(Number(fromState)) && Number(fromState) > 0) return Number(fromState);
    const fromSession = sessionStorage.getItem('rating_current_page');
    if (fromSession && !isNaN(Number(fromSession)) && Number(fromSession) > 0) return Number(fromSession);
    return 1;
  }, [pageQuery, location.state]);

  const [currentPage, setCurrentPage] = useState(initialPage);
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
  const [gotoPageInput, setGotoPageInput] = useState('');
  const [pageValidationError, setPageValidationError] = useState('');
  const [highlightedChainage, setHighlightedChainage] = useState(null);
  const [noMatchingChainage, setNoMatchingChainage] = useState(false);
  const matchedRowRef = React.useRef(null);
  const searchRequestIdRef = React.useRef(0);

  useEffect(() => {
    if (highlightedChainage && matchedRowRef.current) {
      matchedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [questions, highlightedChainage]);

  useEffect(() => {
    if (pageValidationError) {
      const timer = setTimeout(() => {
        setPageValidationError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [pageValidationError]);

  const handleGoToPage = (e) => {
    if (e) e.preventDefault();
    
    const trimmed = String(gotoPageInput).trim();
    if (!trimmed) {
      setPageValidationError('Please enter a page number');
      return;
    }

    // Check for non-integers, decimals, or invalid characters
    if (!/^\d+$/.test(trimmed)) {
      setPageValidationError('Please enter a valid whole number');
      return;
    }

    const targetPage = parseInt(trimmed, 10);

    if (isNaN(targetPage) || targetPage <= 0) {
      setPageValidationError('Page number must be at least 1');
      return;
    }

    if (targetPage > totalPages) {
      setPageValidationError(`Page cannot exceed total pages (${totalPages})`);
      return;
    }

    setPageValidationError('');
    setCurrentPage(targetPage);
    sessionStorage.setItem('rating_current_page', String(targetPage));
    if (activeBatchId) {
      loadBatchTasks(activeBatchId, targetPage, appliedFilters, { jumpToMinChainage: false });
    }
  };

  // Synchronize URL query parameter with currentPage
  useEffect(() => {
    const currentParam = parseInt(searchParams.get('page'), 10);
    if (currentParam !== currentPage && currentPage > 0) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('page', currentPage);
        return next;
      }, { replace: true });
    }
  }, [currentPage, searchParams, setSearchParams]);

  // Synchronize state if URL page param changes externally
  useEffect(() => {
    if (!isNaN(pageQuery) && pageQuery > 0 && pageQuery !== currentPage) {
      setCurrentPage(pageQuery);
      sessionStorage.setItem('rating_current_page', String(pageQuery));
      if (activeBatchId) {
        loadBatchTasks(activeBatchId, pageQuery, appliedFilters);
      }
    }
  }, [pageQuery, activeBatchId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const loadBatchTasks = async (batchId, page = 1, filters = appliedFilters, options = {}) => {
    const requestId = ++searchRequestIdRef.current;
    try {
      setLoading(true);
      setNoMatchingChainage(false);
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
      if (options?.jumpToMinChainage) queryParams.jumpToMinChainage = true;

      const data = await ratingService.getBatchTasks(cleanBatchId, queryParams);
      if (requestId !== searchRequestIdRef.current) return;

      let fetchedTasks = Array.isArray(data) ? data : (data?.data || []);
      let calculatedTotalPages = 1;
      let effectivePage = page;
      let matchedCh = null;

      if (!Array.isArray(fetchedTasks) && fetchedTasks?.tasks) {
        calculatedTotalPages = fetchedTasks.totalPages || Math.ceil((fetchedTasks.total || 0) / 10) || 1;
        effectivePage = fetchedTasks.page || page;
        matchedCh = fetchedTasks.matchedChainage || null;
        if (fetchedTasks.noMatch) {
          setNoMatchingChainage(true);
        }
        fetchedTasks = fetchedTasks.tasks;
      } else if (Array.isArray(fetchedTasks)) {
        calculatedTotalPages = Math.ceil(fetchedTasks.length / 10) || 1;
      }
      
      if (!Array.isArray(fetchedTasks)) {
        fetchedTasks = [];
      }

      if (options?.jumpToMinChainage && effectivePage) {
        setCurrentPage(effectivePage);
        sessionStorage.setItem('rating_current_page', String(effectivePage));
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('page', effectivePage);
          return next;
        }, { replace: true });
      }

      setHighlightedChainage(filters?.minChainage ? (matchedCh || filters.minChainage) : null);
      
      const tasksAsAssets = fetchedTasks.map((task, localIndex) => {
        const firstParam = task.parameters?.[0] || {};
        const paramCount = Array.isArray(task.parameters) && task.parameters.length > 0
          ? task.parameters.length
          : (Array.isArray(task.ratings) && task.ratings.length > 0 ? task.ratings.length : 8);

        const globalIndex = (effectivePage - 1) * 10 + localIndex;

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
      if (requestId !== searchRequestIdRef.current) return;
      console.error('Error loading batch tasks:', err);
      setQuestions([]);
      setTotalPages(1);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setLoading(false);
      }
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
          await loadBatchTasks(bId, initialPage, appliedFilters);
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
          sessionStorage.setItem('rating_current_page', '1');
          loadBatchTasks(selectedId, 1, appliedFilters);
        }
      }
    }
  }, [version, allBatches, activeBatchId]);

  const currentItems = questions;
  
  const handleGetRatings = () => {
    const trimmedMin = (minChainage || '').trim();
    const trimmedMax = (maxChainage || '').trim();
    const newFilters = {
      category: selectedCategory,
      minChainage: trimmedMin,
      maxChainage: trimmedMax,
      direction,
      roadType,
      paramType,
      concernedItems,
    };
    setAppliedFilters(newFilters);
    setGotoPageInput('');
    setPageValidationError('');
    setNoMatchingChainage(false);
    if (activeBatchId) {
      loadBatchTasks(activeBatchId, 1, newFilters, { jumpToMinChainage: Boolean(trimmedMin) });
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
            
            {/* Top Header & Tabs */}
            <div className="flex items-center justify-between p-4 border-b border-borderColor overflow-x-auto shrink-0 gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const basePath = location.pathname.startsWith('/rating-v2') ? '/rating-v2' : '/rating';
                    navigate(basePath);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-green-50 hover:text-[#5cb85c] border border-gray-300 hover:border-[#5cb85c] rounded-md transition-all shadow-sm shrink-0 cursor-pointer"
                  title="Back to Rating Projects"
                >
                  <MdArrowBack className="text-base" />
                  <span>Back</span>
                </button>
                {roadId && (
                  <span className="text-xs font-bold text-[#5cb85c] bg-green-50 border border-[#5cb85c]/30 px-2.5 py-1 rounded tracking-wide">
                    {roadId}
                  </span>
                )}
              </div>
              <SegmentedFilters 
                filters={tabsFilters} 
                activeFilter={activeTab} 
                onFilterChange={setActiveTab} 
              />
            </div>

      <div className="p-6 flex flex-col flex-1 overflow-hidden">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6 shrink-0 items-start">
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
                sessionStorage.setItem('rating_current_page', '1');
                setGotoPageInput('');
                setPageValidationError('');
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
            <input id="filter-min-chainage" name="minChainage" type="text" value={minChainage} onChange={(e) => setMinChainage(e.target.value)} placeholder="Enter Chainage" className="w-full border border-[#5cb85c] rounded px-3 py-1.5 min-h-[34px] md:min-h-[38px] text-sm bg-white focus:outline-none focus:border-[#5cb85c] focus:ring-2 focus:ring-[#5cb85c]/20 transition-all" />
          </div>
          <div>
            <label htmlFor="filter-max-chainage" className="block text-xs font-medium text-gray-700 mb-1">Max Chainage :</label>
            <input id="filter-max-chainage" name="maxChainage" type="text" value={maxChainage} onChange={(e) => setMaxChainage(e.target.value)} placeholder="Enter Chainage" className="w-full border border-[#5cb85c] rounded px-3 py-1.5 min-h-[34px] md:min-h-[38px] text-sm bg-white focus:outline-none focus:border-[#5cb85c] focus:ring-2 focus:ring-[#5cb85c]/20 transition-all" />
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
          <div className="relative">
            <label htmlFor="filter-goto-page" className="block text-xs font-medium text-gray-700 mb-1">Go to Page :</label>
            <div className="flex items-center gap-1.5">
              <input
                id="filter-goto-page"
                name="gotoPage"
                type="number"
                min="1"
                max={totalPages}
                value={gotoPageInput}
                onChange={(e) => {
                  setGotoPageInput(e.target.value);
                  if (pageValidationError) setPageValidationError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGoToPage();
                  } else if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                    e.preventDefault();
                  }
                }}
                placeholder="Enter page number"
                className={`w-full min-w-0 border ${
                  pageValidationError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-[#5cb85c] focus:border-[#5cb85c] focus:ring-[#5cb85c]/20'
                } rounded px-2.5 py-1.5 min-h-[34px] md:min-h-[38px] text-sm bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 placeholder:text-xs`}
              />
              <button
                type="button"
                onClick={handleGoToPage}
                className="bg-[#5cb85c] hover:bg-green-600 active:bg-green-700 text-white font-medium px-3.5 py-1.5 min-h-[34px] md:min-h-[38px] rounded text-sm transition-colors shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
                title="Go to page"
              >
                Go
              </button>
            </div>
            {pageValidationError && (
              <div className="absolute top-full left-0 mt-1 z-30 flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                <span>{pageValidationError}</span>
              </div>
            )}
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
          
          {canExport && (
            <button onClick={handleExportCSV} className="flex items-center gap-2 border-2 border-[#5cb85c] text-[#5cb85c] hover:bg-green-50 font-medium py-1.5 px-4 rounded text-sm transition-colors mb-0.5">
              <MdOutlineFileDownload className="text-lg" />
              Generate CSV
            </button>
          )}
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
              ) : noMatchingChainage ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p className="text-amber-600 font-semibold text-base">No matching chainage found</p>
                      <p className="text-gray-500 text-xs">No records found matching chainage &ge; {appliedFilters.minChainage || minChainage} with the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">No rating records found for this version/filter.</td></tr>
              ) : currentItems.map((q, index) => {
                const prevTask = index > 0 ? currentItems[index - 1] : null;
                const isMatch = highlightedChainage && (
                  parseFloat(q.chainage) === parseFloat(highlightedChainage) ||
                  (parseFloat(q.chainage) >= parseFloat(highlightedChainage) && (!prevTask || parseFloat(prevTask.chainage) < parseFloat(highlightedChainage)))
                );
                return (
                <tr 
                  key={index} 
                  ref={isMatch ? matchedRowRef : null}
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
                    const recordGlobalIndex = (currentPage - 1) * 10 + index;
                    navigate(`${basePath}/${cleanBatchId}?startIndex=${recordGlobalIndex}&page=${currentPage}${reviewQuery}`, { 
                      state: { roadId, currentPage } 
                    });
                  }}
                  className={`border-b border-[#5cb85c]/20 hover:bg-green-50/50 cursor-pointer ${
                    isMatch 
                      ? 'bg-green-100/70 border-l-4 border-l-[#5cb85c]' 
                      : index % 2 === 0 
                        ? 'bg-white' 
                        : 'bg-[#5cb85c]/[0.02]'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-900 font-medium">{q.assetId}</td>
                  <td className="px-4 py-3 text-gray-600">{q.project}</td>
                  <td className="px-4 py-3 text-gray-600">{q.category}</td>
                  <td className="px-4 py-3 text-gray-600">{q.assetType}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className={isMatch ? 'font-bold text-[#2e7d32]' : ''}>{q.chainage}</span>
                    {isMatch && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#5cb85c] text-white">
                        MATCH
                      </span>
                    )}
                  </td>
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
                sessionStorage.setItem('rating_current_page', String(page));
                setPageValidationError('');
                if (activeBatchId) {
                  loadBatchTasks(activeBatchId, page, appliedFilters, { jumpToMinChainage: false });
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

