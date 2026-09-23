import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import HiRateRoadLoader from '../components/common/HiRateRoadLoader';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ExcelViewer from '../components/ExcelViewer';
import DynamicStripChart from '../components/DynamicStripChart';
import OverviewStripChart from '../components/OverviewStripChart';
import PerformanceCenterModal from './Reports/PerformanceCenterModal';
import { reportService } from '../services/report.service';
import { Download, FileSpreadsheet, Loader2, BarChart2, AlertTriangle, Hash, MapPin, CheckCircle, Eye, ChevronDown, ChevronRight, X, TrendingUp } from 'lucide-react';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ projects: [] });
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [reportType, setReportType] = useState('detailed');
  
  const [previousCycle, setPreviousCycle] = useState('');
  const [currentCycle, setCurrentCycle] = useState('');
  
  const [roadType, setRoadType] = useState('Both');
  const [direction, setDirection] = useState('Both');
  
  const [chainageType, setChainageType] = useState('all');
  const [chainageFrom, setChainageFrom] = useState('');
  const [chainageTo, setChainageTo] = useState('');
  const [chainageError, setChainageError] = useState('');
  
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [selectedParameter, setSelectedParameter] = useState('all');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const [flyoutPosition, setFlyoutPosition] = useState(null);
  const dropdownRef = React.useRef(null);
  
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const [generating, setGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [stripChartData, setStripChartData] = useState(null);
  const [showPerformanceCenter, setShowPerformanceCenter] = useState(false);

  useEffect(() => {
    fetchConfig();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !event.target.closest('.parameter-flyout')) {
        setAssetDropdownOpen(false);
        setHoveredAsset(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAssetTypes = async (project, cycle, rt, dir) => {
    setLoadingAssets(true);
    try {
      const data = await reportService.getAssetTypes(project, cycle, rt, dir);
      console.log('Asset types data:', data);
      
      // Handle various response formats just in case
      if (Array.isArray(data)) {
        setAssetTypes(data);
      } else if (data && data.data && Array.isArray(data.data)) {
        setAssetTypes(data.data);
      } else if (data && data.data && Array.isArray(data.data.data)) {
        setAssetTypes(data.data.data);
      } else {
        console.error('Unexpected format:', data);
        setAssetTypes(data?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch asset types', error);
      setAssetTypes([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchAssetTypes(selectedProject, selectedCycle, roadType, direction);
      setSelectedAssetType('all');
      setSelectedParameter('all');
    }
  }, [selectedProject, selectedCycle, roadType, direction]);

  useEffect(() => {
    if (selectedProject) {
      fetchSummary(selectedProject, selectedCycle, selectedAssetType, selectedParameter);
      setGenerateSuccess(false);
      setPreviewUrl(null);
      setPreviewType(null);
      setStripChartData(null);
    }
  }, [selectedProject, selectedCycle, selectedAssetType, selectedParameter, roadType, direction]);

  const fetchConfig = async () => {
    try {
      const data = await reportService.getConfig();
      if (data.success) {
        setConfig(data.data);
        if (data.data.projects.length > 0) {
          setSelectedProject(data.data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch report config', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (project, cycle, asset, param) => {
    setLoadingSummary(true);
    try {
      const data = await reportService.getSummary(project, cycle, chainageType, chainageFrom, chainageTo, asset || selectedAssetType, param || selectedParameter, roadType, direction);
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch report summary', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const validateChainage = () => {
    if (chainageType === 'custom') {
      if (chainageFrom === '' || chainageTo === '') {
        setChainageError('Please enter both From and To chainage.');
        return false;
      }
      const from = parseFloat(chainageFrom);
      const to = parseFloat(chainageTo);
      if (isNaN(from) || isNaN(to)) {
        setChainageError('Please enter valid numeric chainage values.');
        return false;
      }
      if (from >= to) {
        setChainageError('From chainage must be less than To chainage.');
        return false;
      }
    }
    setChainageError('');
    return true;
  };

  const validateComparisonCycles = () => {
    if (reportType !== 'comparison' && reportType !== 'overview-strip-chart') return true;
    if (!previousCycle || !currentCycle) {
      alert("Please select both Previous Cycle and Current Cycle.");
      return false;
    }
    
    if (activeProjectData) {
      const prevIdx = activeProjectData.cycles.findIndex(c => c.id === previousCycle);
      const currIdx = activeProjectData.cycles.findIndex(c => c.id === currentCycle);
      
      // In the backend, batches are sorted by createdAt: -1 (newest first). 
      // Thus, a larger index means an older cycle. 
      // Previous Cycle must be older (larger index) than Current Cycle (smaller index).
      if (prevIdx <= currIdx) {
        alert("Previous Cycle must be earlier than Current Cycle.");
        return false;
      }
    }
    
    return true;
  };

  const handlePreview = async () => {
    if (!selectedProject) return;
    if (!validateChainage()) return;
    if (!validateComparisonCycles()) return;
    setPreviewing(true);
    setGenerateSuccess(false);
    
    // Revoke old URL if it exists
    if (previewUrl && previewUrl !== 'strip-chart' && previewUrl !== 'overview-strip-chart') {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      // Refresh summary KPIs with new chainage filter
      await fetchSummary(selectedProject, selectedCycle, selectedAssetType, selectedParameter);
      
      let result;
      if (reportType === 'pdf' || reportType === 'summary-pdf') {
        const isSummary = reportType === 'summary-pdf';
        result = await reportService.generatePdfReport(selectedProject, selectedCycle, 'preview', chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction, isSummary);
      } else if (reportType === 'comparison') {
        result = await reportService.generateComparisonPdfReport(selectedProject, previousCycle, currentCycle, 'preview', chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
      } else if (reportType === 'dynamic-strip-chart') {
        result = await reportService.getStripChartData(selectedProject, selectedCycle, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
        if (result && result.success !== false) {
           setStripChartData(result.data);
           setPreviewType(reportType);
           setPreviewUrl('strip-chart');
        }
      } else if (reportType === 'overview-strip-chart') {
        result = await reportService.getOverviewStripChartData(selectedProject, previousCycle, currentCycle, chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
        if (result && result.success !== false) {
           setStripChartData(result.data);
           setPreviewType(reportType);
           setPreviewUrl('overview-strip-chart');
        }
      } else {
        result = await reportService.generateExcelReport(selectedProject, selectedCycle, 'preview', chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
      }
      
      if (result && result.success && result.url) {
        setPreviewUrl(result.url);
        setPreviewType(reportType);
      }
    } catch (error) {
      console.error('Failed to generate preview', error);
      alert('Failed to generate preview. Error: ' + (error.message || JSON.stringify(error)));
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedProject) return;
    if (!validateChainage()) return;
    if (!validateComparisonCycles()) return;
    setGenerating(true);
    setGenerateSuccess(false);
    try {
      if (previewUrl && previewType === reportType) {
        // Download the existing preview directly
        const link = document.createElement('a');
        link.href = previewUrl;
        const dateStr = new Date().toISOString().slice(0, 10);
        const extension = (reportType === 'pdf' || reportType === 'summary-pdf' || reportType === 'comparison') ? 'pdf' : 'xlsx';
        const prefix = reportType === 'comparison' ? 'Issue_Comparison_Report' : (reportType === 'summary-pdf' ? 'Summary_Report' : 'Comprehensive_Audit_Report');
        link.setAttribute('download', `${prefix}_${selectedProject}_${dateStr}.${extension}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate a new one if settings changed without previewing
        if (reportType === 'pdf' || reportType === 'summary-pdf') {
          const isSummary = reportType === 'summary-pdf';
          await reportService.generatePdfReport(selectedProject, selectedCycle, 'download', chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction, isSummary);
        } else if (reportType === 'comparison') {
          await reportService.generateComparisonPdfReport(selectedProject, previousCycle, currentCycle, 'download', chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
        } else {
          await reportService.generateExcelReport(selectedProject, selectedCycle, 'download', chainageType, chainageFrom, chainageTo, selectedAssetType, selectedParameter, roadType, direction);
        }
      }
      setGenerateSuccess(true);
    } catch (error) {
      console.error('Failed to download report', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const activeProjectData = config.projects.find(p => p.id === selectedProject);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pageBg font-outfit">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto p-8 lg:px-16">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
              <p className="text-gray-500 mt-2 text-lg">Generate inspection-cycle reports directly from completed HiRATE rating data.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Configuration Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end">
                    
                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">PROJECT</label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedProject}
                        onChange={(e) => {
                          setSelectedProject(e.target.value);
                          setSelectedCycle('all');
                        }}
                      >
                        {config.projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {reportType !== 'comparison' && reportType !== 'overview-strip-chart' && (
                      <div className="space-y-2 col-span-1">
                        <label className="text-sm font-semibold text-gray-700 tracking-wide">INSPECTION CYCLE</label>
                        <select 
                          className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                          value={selectedCycle}
                          onChange={(e) => setSelectedCycle(e.target.value)}
                          disabled={!activeProjectData}
                        >
                          <option value="all">[All Cycles]</option>
                          {activeProjectData?.cycles.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {(reportType === 'comparison' || reportType === 'overview-strip-chart') && (
                      <>
                        <div className="space-y-2 col-span-1">
                          <label className="text-sm font-semibold text-gray-700 tracking-wide">PREVIOUS CYCLE</label>
                          <select 
                            className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                            value={previousCycle}
                            onChange={(e) => setPreviousCycle(e.target.value)}
                            disabled={!activeProjectData}
                          >
                            <option value="">[Select Previous Cycle]</option>
                            {activeProjectData?.cycles.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2 col-span-1">
                          <label className="text-sm font-semibold text-gray-700 tracking-wide">CURRENT CYCLE</label>
                          <select 
                            className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                            value={currentCycle}
                            onChange={(e) => setCurrentCycle(e.target.value)}
                            disabled={!activeProjectData}
                          >
                            <option value="">[Select Current Cycle]</option>
                            {activeProjectData?.cycles.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">ROAD TYPE</label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                        value={roadType}
                        onChange={(e) => setRoadType(e.target.value)}
                      >
                        <option value="Both">Both</option>
                        <option value="MCW">MCW</option>
                        <option value="SR">SR</option>
                      </select>
                    </div>

                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">DIRECTION</label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                        value={direction}
                        onChange={(e) => setDirection(e.target.value)}
                      >
                        <option value="Both">Both</option>
                        <option value="LHS">LHS</option>
                        <option value="RHS">RHS</option>
                      </select>
                    </div>

                    <div className="space-y-2 relative col-span-1 md:col-span-2" ref={dropdownRef}>
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">ASSET TYPE</label>
                      <div 
                        className={`w-full h-12 px-4 rounded-xl border bg-gray-50 flex items-center justify-between cursor-pointer ${loadingAssets || !activeProjectData ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-500' : 'border-gray-200 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        onMouseDown={(e) => {
                          if (!loadingAssets && activeProjectData) {
                            e.preventDefault();
                            setAssetDropdownOpen(!assetDropdownOpen);
                          }
                        }}
                      >
                         <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{selectedAssetType === 'all' ? '[All Assets]' : selectedAssetType}</span>
                            {loadingAssets && <Loader2 size={14} className="animate-spin ml-2 text-indigo-500 shrink-0" />}
                            {selectedParameter !== 'all' && (
                               <>
                                  <span className="text-gray-400 shrink-0">/</span>
                                  <span className="text-indigo-600 font-medium truncate shrink-0">{selectedParameter}</span>
                                  <button 
                                     onClick={(e) => { e.stopPropagation(); setSelectedParameter('all'); }}
                                     className="hover:text-red-500 ml-1 shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
                                  ><X size={14} /></button>
                               </>
                            )}
                         </div>
                         <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" />
                      </div>

                      {assetDropdownOpen && (
                         <div className="absolute top-20 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 max-h-[400px] overflow-y-auto">
                            <div 
                               className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                               onMouseDown={(e) => { e.preventDefault(); setSelectedAssetType('all'); setSelectedParameter('all'); setAssetDropdownOpen(false); setHoveredAsset(null); }}
                            >
                               [All Assets]
                            </div>
                            {assetTypes.map(a => (
                               <div 
                                  key={a.assetType}
                                  className={`px-4 py-2 cursor-pointer relative group flex justify-between items-center text-sm ${hoveredAsset === a.assetType ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                  onMouseEnter={(e) => {
                                      setHoveredAsset(a.assetType);
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const flyoutWidth = 320; // fallback width ~80rem
                                      let left = rect.right + 4;
                                      if (left + flyoutWidth > window.innerWidth) {
                                          left = rect.left - flyoutWidth - 4;
                                      }
                                      setFlyoutPosition({ top: rect.top, left });
                                  }}
                                  onMouseDown={(e) => { e.preventDefault(); setSelectedAssetType(a.assetType); setSelectedParameter('all'); setAssetDropdownOpen(false); setHoveredAsset(null); }}
                               >
                                  <span className="truncate">{a.assetType}</span>
                                  {a.parameters && a.parameters.length > 0 && <ChevronRight size={14} className="text-gray-400 shrink-0 ml-2" />}

                                  {/* Flyout for parameters */}
                                  {hoveredAsset === a.assetType && a.parameters && a.parameters.length > 0 && flyoutPosition && createPortal(
                                     <div 
                                        className="parameter-flyout fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] py-2 max-h-[400px] overflow-y-auto w-72 md:w-80"
                                        style={{ top: flyoutPosition.top, left: flyoutPosition.left }}
                                     >
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1 bg-gray-50 sticky top-0">Parameters for {a.assetType}</div>
                                        {a.parameters.map(p => (
                                           <div 
                                              key={p}
                                              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm break-words whitespace-normal"
                                              onMouseDown={(e) => { 
                                                 e.preventDefault();
                                                 e.stopPropagation(); 
                                                 setSelectedAssetType(a.assetType); 
                                                 setSelectedParameter(p); 
                                                 setAssetDropdownOpen(false); 
                                                 setHoveredAsset(null);
                                              }}
                                           >
                                              {p}
                                           </div>
                                        ))}
                                     </div>,
                                     document.body
                                  )}
                               </div>
                            ))}
                         </div>
                      )}
                    </div>

                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">REPORT TYPE</label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                      >
                        <option value="detailed">Detailed Excel Report</option>
                        <option value="pdf">Comprehensive report - pdf</option>
                        <option value="summary-pdf">Summary Report - PDF</option>
                        <option value="comparison">Issue comparison report - pdf</option>
                        <option value="dynamic-strip-chart">Dynamic Strip Chart</option>
                        <option value="overview-strip-chart">Overview Strip Chart</option>
                      </select>
                    </div>

                    <div className={`space-y-2 relative col-span-1 md:col-span-2 ${chainageType === 'custom' ? 'xl:col-span-2' : 'xl:col-span-1'}`}>
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">CHAINAGE</label>
                      <div className="flex gap-2 w-full">
                        <select 
                          className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                          value={chainageType}
                          onChange={(e) => {
                            setChainageType(e.target.value);
                            setChainageError('');
                          }}
                        >
                          <option value="all">All</option>
                          <option value="custom">Custom</option>
                        </select>
                        {chainageType === 'custom' && (
                          <>
                            <input 
                              type="number" step="any" placeholder="From"
                              className="w-24 h-12 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                              value={chainageFrom} onChange={(e) => { setChainageFrom(e.target.value); setChainageError(''); }}
                            />
                            <input 
                              type="number" step="any" placeholder="To"
                              className="w-24 h-12 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                              value={chainageTo} onChange={(e) => { setChainageTo(e.target.value); setChainageError(''); }}
                            />
                          </>
                        )}
                      </div>
                      {chainageError && <div className="text-red-500 text-xs absolute -bottom-5 left-0 font-medium">{chainageError}</div>}
                    </div>

                    <div className={`grid grid-cols-2 gap-2 col-span-1 md:col-span-2 ${chainageType === 'custom' ? 'xl:col-span-1' : 'xl:col-span-2'}`}>
                      <button
                        onClick={handlePreview}
                        disabled={previewing || generating || !selectedProject || loadingSummary}
                        className="w-full h-12 bg-white border border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {previewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                        <span>PREVIEW</span>
                      </button>
                      
                      <button
                        onClick={handleDownload}
                        disabled={generating || previewing || !selectedProject || loadingSummary || reportType === 'dynamic-strip-chart' || reportType === 'overview-strip-chart'}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                      >
                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        <span>DOWNLOAD</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Summary Section */}
                {summary && !loadingSummary && (
                  <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-800">Project Overview</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="text-gray-500 mb-2"><Hash className="w-5 h-5" /></div>
                        <div className="text-2xl font-bold text-gray-900">{summary.totalRatings}</div>
                        <div className="text-sm font-medium text-gray-500">Total Ratings</div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="text-gray-500 mb-2"><MapPin className="w-5 h-5" /></div>
                        <div className="text-2xl font-bold text-gray-900">{summary.uniqueChainages}</div>
                        <div className="text-sm font-medium text-gray-500">Unique Chainages</div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="text-gray-500 mb-2"><BarChart2 className="w-5 h-5" /></div>
                        <div className="text-2xl font-bold text-gray-900">{summary.parametersRated}</div>
                        <div className="text-sm font-medium text-gray-500">Parameters Rated</div>
                      </div>

                      <div className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between">
                        <div className="text-red-500 mb-2"><AlertTriangle className="w-5 h-5" /></div>
                        <div className="text-2xl font-bold text-red-700">{summary.criticalRatings}</div>
                        <div className="text-sm font-medium text-red-600">Critical Ratings</div>
                      </div>

                      <div className="bg-indigo-50 p-5 rounded-2xl shadow-sm border border-indigo-100 flex flex-col justify-between">
                        <div className="text-indigo-500 mb-2"><BarChart2 className="w-5 h-5" /></div>
                        <div className="text-2xl font-bold text-indigo-700">{summary.averageRating}</div>
                        <div className="text-sm font-medium text-indigo-600">Average Rating</div>
                      </div>

                      <div className="bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-700 flex flex-col justify-between text-white">
                        <div className="text-gray-400 mb-2"><CheckCircle className="w-5 h-5" /></div>
                        <div className="text-lg font-bold truncate" title={summary.inspectionDateRange}>{summary.inspectionDateRange}</div>
                        <div className="text-sm font-medium text-gray-400">Date Range</div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Preview Section */}
                {previewUrl && (
                  <div className="space-y-6 animate-fadeIn mt-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">Report Preview</h2>
                      {previewType !== 'dynamic-strip-chart' && previewType !== 'overview-strip-chart' && (
                        <button
                          onClick={handleDownload}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download File
                        </button>
                      )}
                    </div>
                    
                    {previewType === 'dynamic-strip-chart' ? (
                      <DynamicStripChart data={stripChartData} summary={summary} />
                    ) : previewType === 'overview-strip-chart' ? (
                      <OverviewStripChart data={stripChartData} summary={summary} />
                    ) : (
                      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        {previewType === 'pdf' || previewType === 'summary-pdf' || previewType === 'comparison' ? (
                          <iframe 
                            src={previewUrl} 
                            title="PDF Preview" 
                            className="w-full h-[600px] rounded-xl border border-gray-200" 
                          />
                        ) : (
                          <ExcelViewer blobUrl={previewUrl} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Success Banner */}
                {generateSuccess && summary && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4 animate-fadeIn shadow-sm">
                    <div className="bg-green-500 text-white p-2 rounded-full mt-1">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-800">Report Generated Successfully</h3>
                      <p className="text-green-700 mt-1">The professional {reportType === 'pdf' || reportType === 'summary-pdf' || reportType === 'comparison' ? 'PDF report' : 'Excel workbook'} for <strong>{summary.projectName}</strong> has been downloaded to your device.</p>
                      
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Ratings</p>
                          <p className="text-lg font-bold text-green-900">{summary.totalRatings}</p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">Critical Issues</p>
                          <p className="text-lg font-bold text-green-900">{summary.criticalRatings}</p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">Average Rating</p>
                          <p className="text-lg font-bold text-green-900">{summary.averageRating}</p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">Generated At</p>
                          <p className="text-lg font-bold text-green-900">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ ASSET PERFORMANCE & DECISION CENTER ═══ */}
                {selectedProject && (
                  <div className="mt-10 pt-8 border-t-2 border-gray-100">
                    <div className="bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] rounded-2xl shadow-lg p-8 text-white">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-blue-300" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">ASSET PERFORMANCE & DECISION CENTER</h2>
                          </div>
                          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                            Transform current inspection data into project-level condition, asset, risk and corridor intelligence.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPerformanceCenter(true)}
                          disabled={!selectedProject}
                          className="px-6 py-3 bg-white text-[#0F172A] hover:bg-blue-50 font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                          id="open-performance-center-btn"
                        >
                          <TrendingUp className="w-5 h-5" />
                          OPEN PERFORMANCE CENTER
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Center Modal */}
                <PerformanceCenterModal
                  isOpen={showPerformanceCenter}
                  onClose={() => setShowPerformanceCenter(false)}
                  project={selectedProject}
                  cycleId={selectedCycle}
                  roadType={roadType}
                  direction={direction}
                  chainageType={chainageType}
                  chainageFrom={chainageFrom}
                  chainageTo={chainageTo}
                  assetType={selectedAssetType}
                  parameter={selectedParameter}
                />

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
// force reload
