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
import { Download, FileSpreadsheet, Loader2, BarChart2, AlertTriangle, Hash, MapPin, CheckCircle, Eye, ChevronDown, ChevronRight, X, TrendingUp, Calendar, ShieldCheck, Settings } from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';
import ProjectOverview from '../components/Reports/ProjectOverview/ProjectOverview';
import highwayBg from '../assets/banner_bg.png';
import AnimatedAssignButton from '../components/common/AnimatedAssignButton';
import GenerateBatchButton from './InspectionEngine/components/GenerateBatchButton';

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
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Configuration Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end">
                    
                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">PROJECT</label>
                      <CustomDropdown
                        value={selectedProject}
                        onChange={(val) => {
                          setSelectedProject(val);
                          setSelectedCycle('all');
                        }}
                        options={config.projects.map(p => ({ label: p.name, value: p.id }))}
                      />
                    </div>

                    {reportType !== 'comparison' && reportType !== 'overview-strip-chart' && (
                      <div className="space-y-2 col-span-1">
                        <label className="text-sm font-semibold text-gray-700 tracking-wide">INSPECTION CYCLE</label>
                        <CustomDropdown
                          value={selectedCycle}
                          onChange={(val) => setSelectedCycle(val)}
                          disabled={!activeProjectData}
                          options={[
                            { label: '[All Cycles]', value: 'all' },
                            ...(activeProjectData?.cycles.map(c => ({ label: c.label, value: c.id })) || [])
                          ]}
                        />
                      </div>
                    )}
                    
                    {(reportType === 'comparison' || reportType === 'overview-strip-chart') && (
                      <>
                        <div className="space-y-2 col-span-1">
                          <label className="text-sm font-semibold text-gray-700 tracking-wide">PREVIOUS CYCLE</label>
                          <CustomDropdown
                            value={previousCycle}
                            onChange={(val) => setPreviousCycle(val)}
                            disabled={!activeProjectData}
                            options={[
                              { label: '[Select Previous Cycle]', value: '' },
                              ...(activeProjectData?.cycles.map(c => ({ label: c.label, value: c.id })) || [])
                            ]}
                          />
                        </div>
                        <div className="space-y-2 col-span-1">
                          <label className="text-sm font-semibold text-gray-700 tracking-wide">CURRENT CYCLE</label>
                          <CustomDropdown
                            value={currentCycle}
                            onChange={(val) => setCurrentCycle(val)}
                            disabled={!activeProjectData}
                            options={[
                              { label: '[Select Current Cycle]', value: '' },
                              ...(activeProjectData?.cycles.map(c => ({ label: c.label, value: c.id })) || [])
                            ]}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">ROAD TYPE</label>
                      <CustomDropdown
                        value={roadType}
                        onChange={(val) => setRoadType(val)}
                        options={[
                          { label: 'Both', value: 'Both' },
                          { label: 'MCW', value: 'MCW' },
                          { label: 'SR', value: 'SR' }
                        ]}
                      />
                    </div>

                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">DIRECTION</label>
                      <CustomDropdown
                        value={direction}
                        onChange={(val) => setDirection(val)}
                        options={[
                          { label: 'Both', value: 'Both' },
                          { label: 'LHS', value: 'LHS' },
                          { label: 'RHS', value: 'RHS' }
                        ]}
                      />
                    </div>

                    <div className="space-y-2 relative col-span-1 md:col-span-2" ref={dropdownRef}>
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">ASSET TYPE</label>
                      <div 
                        className={`w-full flex items-center justify-between px-3 py-1.5 min-h-[34px] md:min-h-[38px] bg-white border rounded-md text-sm font-medium transition-all duration-200 outline-none ${loadingAssets || !activeProjectData ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-500' : 'cursor-pointer border-[#5cb85c] hover:shadow-[0_2px_8px_rgba(92,184,92,0.15)] text-gray-900 focus:ring-2 focus:ring-[#5cb85c]/20'}`}
                        onMouseDown={(e) => {
                          if (!loadingAssets && activeProjectData) {
                            e.preventDefault();
                            setAssetDropdownOpen(!assetDropdownOpen);
                          }
                        }}
                      >
                         <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{selectedAssetType === 'all' ? '[All Assets]' : selectedAssetType}</span>
                            {loadingAssets && <Loader2 size={14} className="animate-spin ml-2 text-green-500 shrink-0" />}
                            {selectedParameter !== 'all' && (
                               <>
                                  <span className="text-gray-400 shrink-0">/</span>
                                  <span className="text-green-600 font-medium truncate shrink-0">{selectedParameter}</span>
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
                                  className={`px-4 py-2 cursor-pointer relative group flex justify-between items-center text-sm ${hoveredAsset === a.assetType ? 'bg-green-50' : 'hover:bg-gray-50'}`}
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
                                              className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm break-words whitespace-normal"
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
                      <CustomDropdown
                        value={reportType}
                        onChange={(val) => setReportType(val)}
                        options={[
                          { label: 'Detailed Excel Report', value: 'detailed' },
                          { label: 'Comprehensive report - pdf', value: 'pdf' },
                          { label: 'Summary Report - PDF', value: 'summary-pdf' },
                          { label: 'Issue comparison report - pdf', value: 'comparison' },
                          { label: 'Dynamic Strip Chart', value: 'dynamic-strip-chart' },
                          { label: 'Overview Strip Chart', value: 'overview-strip-chart' }
                        ]}
                      />
                    </div>

                    <div className={`space-y-2 relative col-span-1 md:col-span-2 ${chainageType === 'custom' ? 'xl:col-span-2' : 'xl:col-span-1'}`}>
                      <label className="text-sm font-semibold text-gray-700 tracking-wide">CHAINAGE</label>
                      <div className="flex gap-2 w-full">
                        <CustomDropdown
                          value={chainageType}
                          onChange={(val) => {
                            setChainageType(val);
                            setChainageError('');
                          }}
                          options={[
                            { label: 'All', value: 'all' },
                            { label: 'Custom', value: 'custom' }
                          ]}
                        />
                        {chainageType === 'custom' && (
                          <>
                            <input 
                              type="number" step="any" placeholder="From"
                              className="w-24 h-12 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
                              value={chainageFrom} onChange={(e) => { setChainageFrom(e.target.value); setChainageError(''); }}
                            />
                            <input 
                              type="number" step="any" placeholder="To"
                              className="w-24 h-12 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
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
                        className="w-full h-12 bg-white border border-green-600 text-green-700 hover:bg-green-50 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {previewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                        <span>PREVIEW</span>
                      </button>
                      
                      <GenerateBatchButton
                        onClick={handleDownload}
                        disabled={generating || previewing || !selectedProject || loadingSummary || reportType === 'dynamic-strip-chart' || reportType === 'overview-strip-chart'}
                        className="w-full h-12 rounded-xl"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                          <span>DOWNLOAD</span>
                        </div>
                      </GenerateBatchButton>
                    </div>

                  </div>
                </div>

                {/* Summary Section */}
                <ProjectOverview 
                  summary={summary} 
                  loadingSummary={loadingSummary} 
                  selectedCycle={selectedCycle} 
                />

                {/* Preview Section */}
                {previewUrl && (
                  <div className="space-y-6 animate-fadeIn mt-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">Report Preview</h2>
                      {previewType !== 'dynamic-strip-chart' && previewType !== 'overview-strip-chart' && (
                        <button
                          onClick={handleDownload}
                          className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 font-medium rounded-lg flex items-center gap-2 transition-colors"
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
                    <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[160px]">
                      
                      {/* Exact Background Image from Figma with added gradient overlay for text readability */}
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${highwayBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'right center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                        {/* Gradient overlay to ensure text is visible over the image */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-[70%]" />
                      </div>

                      <div className="flex-1 p-8 relative z-20">
                        <div className="flex gap-6">
                          {/* Left Logo Box */}
                          <div className="w-16 h-16 bg-green-100/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-green-200">
                            {/* Road/Route Icon matching mockup */}
                            <svg className="w-8 h-8 text-green-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22V2M7 22l-4-8M17 22l4-8M5 8l4-4M19 8l-4-4" />
                            </svg>
                          </div>
                          
                          <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">ASSET PERFORMANCE & DECISION CENTER</h2>
                            <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed font-medium">
                              Transform current inspection data into project-level condition, asset, risk and corridor intelligence.
                            </p>
                            
                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-4 mt-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-green-700"><BarChart2 className="w-4 h-4" /></div>
                                <span className="text-[11px] font-bold text-slate-700 leading-tight">Data Driven<br/>Decisions</span>
                              </div>
                              <div className="flex items-center gap-3 ml-2">
                                <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-green-700"><ShieldCheck className="w-4 h-4" /></div>
                                <span className="text-[11px] font-bold text-slate-700 leading-tight">Asset<br/>Health</span>
                              </div>
                              <div className="flex items-center gap-3 ml-2">
                                <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-green-700">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V2M7 22l-4-8M17 22l4-8M5 8l4-4M19 8l-4-4" /></svg>
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 leading-tight">Corridor<br/>Intelligence</span>
                              </div>
                              <div className="flex items-center gap-3 ml-2">
                                <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-green-700"><Settings className="w-4 h-4" /></div>
                                <span className="text-[11px] font-bold text-slate-700 leading-tight">Project<br/>Insights</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Section */}
                      <div className="relative z-20 flex items-center justify-end p-8 lg:w-72 shrink-0 lg:pr-10">
                        <AnimatedAssignButton
                          onClick={() => {
                            // Start animation immediately
                            setTimeout(() => {
                              setShowPerformanceCenter(true);
                            }, 1500); // Open exactly when animation hits 'success' state
                            return Promise.resolve();
                          }}
                          disabled={!selectedProject}
                          text="OPEN PERFORMANCE CENTER"
                          successText="OPENING..."
                          flightDistance={250}
                          startOffset={-95}
                          textClassName="text-[11px] uppercase tracking-wider font-bold"
                          idleClassName="bg-[#0a4d29] text-white border-transparent shadow-xl hover:bg-[#07361d]"
                          successClassName="bg-[#0a4d29] text-white border-transparent shadow-xl"
                          className="w-full lg:w-[250px] h-[46px] disabled:opacity-50 disabled:cursor-not-allowed"
                          id="open-performance-center-btn"
                        />
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
