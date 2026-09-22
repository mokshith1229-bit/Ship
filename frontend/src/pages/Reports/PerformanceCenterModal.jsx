import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Loader2, AlertTriangle, MapPin, Target, Camera, Activity, ChevronDown, ChevronUp, Shield, Info, CheckCircle, Navigation, Layers, CheckSquare, Clock, ImageIcon, ImageOff, ClipboardCheck, ClipboardList, Folder, Route, ArrowLeftRight, Construction, Gauge, Lightbulb, TriangleAlert, ChevronRight, MapPinned, TrendingDown, CircleAlert, Image, ChartScatter, Percent } from 'lucide-react';
import { reportService } from '../../services/report.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, AreaChart, Area, Legend, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import IssuePassport from './IssuePassport';

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  good: '#10B981', // Emerald 500
  moderate: '#F59E0B', // Amber 500
  critical: '#DC2626', // Red 600
  brand: '#1E3A8A', // Deep Navy
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <div className="font-bold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || (p.payload && p.payload.fill) || '#fff' }} />
          <span>{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-10 max-w-4xl">
    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase mb-3">{title}</h2>
    {subtitle && <p className="text-slate-500 text-base md:text-lg">{subtitle}</p>}
    <div className="h-1 w-20 bg-blue-700 mt-5 rounded-full" />
  </div>
);

const KPICard = ({ label, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorMap = {
    blue: 'border-l-blue-900',
    green: 'border-l-emerald-600',
    amber: 'border-l-amber-500',
    red: 'border-l-red-600 bg-red-50/30',
    slate: 'border-l-slate-600'
  };
  return (
    <div className={`rounded-xl border border-gray-100 shadow-sm p-6 border-l-4 bg-white ${colorMap[color] || colorMap.blue} transition-all hover:shadow-md h-full flex flex-col justify-between`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div>
        <div className="text-3xl font-extrabold text-gray-900 leading-tight">{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-2 font-medium">{subtitle}</div>}
      </div>
    </div>
  );
};

const PerformanceCenterModal = ({ isOpen, onClose, project, cycleId, roadType, direction, chainageType, chainageFrom, chainageTo, assetType, parameter }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({});
  const [showAllEvidence, setShowAllEvidence] = useState(false);

  // Drill-down states
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [expandedParameter, setExpandedParameter] = useState(null);
  const [recordsData, setRecordsData] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState(null);
  
  // Drill-down for specific issues
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [chainageFilter, setChainageFilter] = useState('All'); // 'All', 'Critical', 'Observation', 'Good'
  
  // Overview Sorting/View Mode
  const [overviewSortBy, setOverviewSortBy] = useState('Critical Audits');
  const [overviewViewMode, setOverviewViewMode] = useState('TABLE');

  useEffect(() => {
    if (isOpen && project) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, project, cycleId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportService.getPerformanceCenterData(
        project, cycleId, chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction
      );
      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to load performance data.');
      }
    } catch (err) {
      console.error('Performance Center Error:', err);
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      await reportService.generateManagementPdfReport(
        project, cycleId, 'download', chainageType, chainageFrom, chainageTo, assetType, parameter, roadType, direction
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate Management Report PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAssetClick = (assetTypeName) => {
    if (expandedAsset === assetTypeName) {
      setExpandedAsset(null);
      setExpandedParameter(null);
    } else {
      setExpandedAsset(assetTypeName);
      setExpandedParameter(null);
    }
  };

  const handleParameterClick = async (assetTypeName, parameterName) => {
    if (expandedParameter === parameterName) {
      setExpandedParameter(null);
      return;
    }
    
    setExpandedParameter(parameterName);
    setChainageFilter('All');
    setLoadingRecords(true);
    setRecordsError(null);
    setRecordsData(null);
    
    try {
      const result = await reportService.getPerformanceRecords(
        project, cycleId, chainageType, chainageFrom, chainageTo, roadType, direction, assetTypeName, parameterName
      );
      if (result && result.success) {
        setRecordsData(result.data);
      } else {
        setRecordsError('Failed to load chainage details.');
      }
    } catch (err) {
      console.error('Failed to fetch records', err);
      setRecordsError('Error loading chainage details.');
    } finally {
      setLoadingRecords(false);
    }
  };  

  const handleIssueClick = async (parameterName) => {
    if (expandedIssue === parameterName) {
      setExpandedIssue(null);
      return;
    }
    
    setExpandedIssue(parameterName);
    setChainageFilter('All');
    setLoadingRecords(true);
    setRecordsError(null);
    setRecordsData(null);
    
    try {
      // Pass 'all' for assetType so we get this parameter across all affected assets
      const result = await reportService.getPerformanceRecords(
        project, cycleId, chainageType, chainageFrom, chainageTo, roadType, direction, 'all', parameterName
      );
      if (result && result.success) {
        setRecordsData(result.data);
      } else {
        setRecordsError('Failed to load issue details.');
      }
    } catch (err) {
      console.error('Failed to fetch issue records', err);
      setRecordsError('Error loading issue details.');
    } finally {
      setLoadingRecords(false);
    }
  };

  const toggleEvidenceExpand = (index) => {
    setExpandedEvidence(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const top5Critical = useMemo(() => {
    if (!data?.assetPerformance?.assets) return [];
    return [...data.assetPerformance.assets].sort((a, b) => b.critical - a.critical).slice(0, 5);
  }, [data]);

  const top5Condition = useMemo(() => {
    if (!data?.assetPerformance?.assets) return [];
    return [...data.assetPerformance.assets].slice(0, 5);
  }, [data]);

  const renderAssetRow = (a, i, viewType = 'default', isClickable = true) => {
    const criticalRate = a.totalRatings > 0 ? ((a.critical / a.totalRatings) * 100).toFixed(1) : '0.0';
    const isExpanded = expandedAsset === a.assetType;
    let conditionBadge = null;
    
    if (viewType === 'condition') {
      const avg = parseFloat(a.avgRating);
      if (avg >= 7) conditionBadge = <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] rounded font-bold uppercase tracking-widest">Good</span>;
      else if (avg >= 4) conditionBadge = <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded font-bold uppercase tracking-widest">Attention</span>;
      else conditionBadge = <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] rounded font-bold uppercase tracking-widest">Critical</span>;
    }

    return (
      <React.Fragment key={`${a.assetType}-${viewType}`}>
        <tr className={`border-b border-gray-50 transition-colors ${isClickable ? 'hover:bg-gray-50 cursor-pointer group' : ''} ${isExpanded && isClickable ? 'bg-blue-50/30' : ''}`} onClick={() => isClickable && handleAssetClick(a.assetType)}>
          <td className="px-4 py-3 text-gray-400 font-bold whitespace-nowrap text-[11px] md:text-xs">
            {i + 1 < 10 ? `0${i+1}` : i+1}
          </td>
          <td className="px-4 py-3 font-bold text-gray-900 flex items-center">
            {isClickable && <svg className={`w-3.5 h-3.5 mr-2 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
            <span className="break-words leading-tight text-[11px] md:text-xs max-w-[120px] md:max-w-[200px] whitespace-normal">{a.assetType || a.name}</span>
          </td>
          {viewType === 'condition' ? (
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="font-bold text-gray-900 text-[11px] md:text-sm">{parseFloat(a.avgRating).toFixed(1)}</span> <span className="text-[9px] text-gray-400">/ 10</span>
              </div>
              <div className="w-12 md:w-16 h-1 bg-gray-200 rounded-full mt-1 ml-auto overflow-hidden">
                <div className={`h-full ${parseFloat(a.avgRating) < 4 ? 'bg-red-500' : parseFloat(a.avgRating) < 7 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${(parseFloat(a.avgRating) / 10) * 100}%` }}></div>
              </div>
            </td>
          ) : viewType === 'attention' ? (
             <td className="px-4 py-3 font-medium text-gray-600 text-[11px] md:text-xs">{a.topIssue || '-'}</td>
          ) : (
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-gray-900 text-[11px] md:text-sm">{parseFloat(a.avgRating).toFixed(1)}</span> <span className="text-[9px] text-gray-400">/ 10</span>
            </td>
          )}
          
          {viewType === 'attention' && (
             <td className="px-4 py-3 text-right">
                <span className="font-bold text-gray-900 text-[11px] md:text-sm">{parseFloat(a.avgRating || 10).toFixed(1)}</span> <span className="text-[9px] text-gray-400">/ 10</span>
             </td>
          )}

          <td className="px-4 py-3 text-right font-medium text-gray-600 text-[11px] md:text-xs">{(a.totalRatings || a.total || 0).toLocaleString()}</td>
          {viewType !== 'condition' && viewType !== 'attention' && <td className="px-4 py-3 text-right font-bold text-amber-600 text-[11px] md:text-xs">{a.issues > 0 ? a.issues.toLocaleString() : '-'}</td>}
          <td className="px-4 py-3 text-right font-extrabold text-red-600 text-[11px] md:text-xs">{(a.critical || 0) > 0 ? (a.critical || 0).toLocaleString() : '-'}</td>
          <td className="px-4 py-3 text-right font-bold text-gray-700 text-[11px] md:text-xs">{criticalRate}%</td>
          {viewType === 'condition' && <td className="px-4 py-3 text-right">{conditionBadge}</td>}
        </tr>
        
        {isExpanded && isClickable && (
          <tr>
            <td colSpan={viewType === 'condition' ? "7" : viewType === 'attention' ? "7" : "7"} className="p-0 border-b border-gray-100 bg-gray-50/50 shadow-inner">
              <div className="p-4 md:p-6">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  ASSET ISSUE BREAKDOWN
                </h4>
                <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 text-[9px] uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold tracking-wider border-b border-gray-200">Parameter</th>
                        <th className="px-4 py-2 text-right font-bold tracking-wider border-b border-gray-200">Total Audits</th>
                        <th className="px-4 py-2 text-right font-bold tracking-wider border-b border-gray-200">Issue Count</th>
                        <th className="px-4 py-2 text-right font-bold tracking-wider border-b border-gray-200">Critical</th>
                        <th className="px-4 py-2 text-right font-bold tracking-wider border-b border-gray-200">Non-Critical</th>
                        <th className="px-4 py-2 text-right font-bold tracking-wider border-b border-gray-200">Avg Rating</th>
                        <th className="px-4 py-2 text-right font-bold tracking-wider border-b border-gray-200">Critical Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {a.parameters && a.parameters.length > 0 ? (
                        a.parameters.map((p) => {
                          const pCritRate = p.totalRatings > 0 ? ((p.critical / p.totalRatings) * 100).toFixed(1) : '0.0';
                          const isParamExpanded = expandedParameter === p.name;
                          return (
                            <React.Fragment key={p.name}>
                              <tr 
                                className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${isParamExpanded ? 'bg-blue-50/30' : ''}`} 
                                onClick={(e) => { e.stopPropagation(); handleParameterClick(a.assetType || a.name, p.name); }}
                              >
                                <td className="px-4 py-2 font-bold text-gray-800 flex items-center whitespace-normal max-w-[150px]">
                                  <svg className={`w-3 h-3 mr-2 shrink-0 text-gray-400 transition-transform ${isParamExpanded ? 'rotate-90 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                  {p.name}
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-gray-500">{p.totalRatings}</td>
                                <td className="px-4 py-2 text-right font-bold text-amber-600">{p.issues > 0 ? p.issues : '-'}</td>
                                <td className="px-4 py-2 text-right font-extrabold text-red-600">{p.critical > 0 ? p.critical : '-'}</td>
                                <td className="px-4 py-2 text-right font-bold text-gray-500">{p.nonCritical > 0 ? p.nonCritical : '-'}</td>
                                <td className="px-4 py-2 text-right font-bold text-gray-900">{p.avgRating}</td>
                                <td className="px-4 py-2 text-right font-bold text-gray-700">{pCritRate}%</td>
                              </tr>
                              
                              {/* Nested Chainage Level Details */}
                              {isParamExpanded && (
                                <tr>
                                  <td colSpan="7" className="p-0 bg-gray-50/30 border-t-0 border-b border-gray-100">
                                    <div className="p-3 border-l-4 border-blue-500 ml-4 mr-2 my-3 bg-white rounded-r-lg shadow-sm">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            CHAINAGE DETAILS
                                          </h5>
                                          {recordsData && recordsData.length > 0 && (
                                            <div className="flex items-center gap-1 border border-gray-200 rounded p-0.5 bg-gray-50">
                                              {['All', 'Critical', 'Observation', 'Good'].map(f => (
                                                <button 
                                                  key={f}
                                                  onClick={(e) => { e.stopPropagation(); setChainageFilter(f); }}
                                                  className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase transition-colors ${chainageFilter === f ? 'bg-white shadow-sm border border-gray-200 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                                >
                                                  {f}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {loadingRecords && <span className="text-[9px] font-bold text-blue-500 animate-pulse">Loading...</span>}
                                      </div>
                                      
                                      {loadingRecords ? (
                                        <div className="py-4 flex justify-center"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                                      ) : recordsError ? (
                                        <div className="text-red-500 text-[10px] font-bold py-2 text-center bg-red-50 rounded">{recordsError}</div>
                                      ) : recordsData && recordsData.filter(rec => chainageFilter === 'All' || rec.status === chainageFilter).length > 0 ? (
                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                          {recordsData.filter(rec => chainageFilter === 'All' || rec.status === chainageFilter).map((rec, rIdx) => (
                                            <div key={rIdx} className="border border-gray-100 rounded p-2 bg-gray-50/50 hover:bg-white transition-colors flex flex-col sm:flex-row gap-3">
                                              <div className="w-20 shrink-0 flex flex-col items-center justify-center bg-white rounded shadow-sm border border-gray-100 p-2 text-center overflow-hidden">
                                                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">CH</span>
                                                <span className="text-xs font-black text-gray-800 break-all leading-tight max-h-12 overflow-hidden">{rec.chainage}</span>
                                              </div>
                                              
                                              <div className="flex-1 flex flex-col gap-1 justify-center">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${rec.status === 'Critical' ? 'bg-red-100 text-red-700' : rec.status === 'Observation' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                    {rec.status}
                                                  </span>
                                                  <span className="text-[9px] font-bold text-gray-400">RATING: <span className="text-gray-800">{rec.rating}/10</span></span>
                                                  <span className="text-[9px] font-bold text-gray-400">DIR: <span className="text-gray-800">{rec.direction}</span></span>
                                                  {rec.assetType && <span className="text-[9px] font-bold text-gray-400">ASSET: <span className="text-gray-800">{rec.assetType}</span></span>}
                                                </div>
                                                
                                                <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
                                                  {rec.remark && rec.remark !== '-' && rec.remark !== 'No remarks provided' ? `"${rec.remark}"` : <span className="text-gray-400 italic font-normal">No remark</span>}
                                                </p>
                                                
                                                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                                  {new Date(rec.date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                              </div>
                                              
                                              {rec.evidence && (
                                                <div className="shrink-0 w-16 h-16 bg-gray-100 flex items-center justify-center rounded shadow-sm overflow-hidden border border-gray-200 relative">
                                                  <ImageOff className="w-6 h-6 text-gray-300 absolute" />
                                                  <img 
                                                    src={rec.evidence} 
                                                    alt="Evidence" 
                                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 relative z-10" 
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="py-4 text-center text-gray-400 text-[10px] font-bold uppercase bg-gray-50 rounded">No records found.</div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 text-center text-gray-400 text-[10px] font-bold uppercase">No parameters found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const conditionPieData = useMemo(() => {
    if (!data?.condition) return [];
    return [
      { name: 'Healthy', value: data.condition.good.count, color: COLORS.good },
      { name: 'Issues', value: data.condition.moderate.count, color: COLORS.moderate },
      { name: 'Critical', value: data.condition.critical.count, color: COLORS.critical }
    ].filter(d => d.value > 0);
  }, [data]);

  const assetMatrixData = useMemo(() => {
    if (!data?.assetPerformance?.assets) return [];
    return data.assetPerformance.assets.map(a => ({
      name: a.assetType,
      x: a.totalRatings,
      y: a.totalRatings > 0 ? (a.critical / a.totalRatings) * 100 : 0,
      z: a.critical || 1 // Bubble size
    }));
  }, [data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-100 flex items-start justify-center overflow-y-auto" id="performance-center-overlay">
      <div className="w-full min-h-screen bg-slate-50 relative flex flex-col" id="performance-center-container">

        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-[10000] p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all shadow-xl border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        {loading && (
          <div className="flex flex-col items-center justify-center py-40 h-screen">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Analyzing highway asset intelligence...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-20">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-bold text-lg">{error}</p>
            <button onClick={fetchData} className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Retry Analysis</button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* ─── 1. HERO: PROJECT AT A GLANCE ─── */}
            <div className="relative w-full bg-slate-900 text-white overflow-hidden pt-24 pb-16 px-8 md:px-16" style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
              minHeight: '600px'
            }}>
              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
              
              <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-center">
                <div className="mb-12">
                  <div className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> HIGHWAY ASSET INTELLIGENCE REPORT
                  </div>
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                    {data.overview.projectName}
                  </h1>
                  <p className="text-xl md:text-2xl text-blue-100 max-w-3xl font-light leading-relaxed">
                    Current inspection overview of network condition, asset performance and critical priorities.
                  </p>
                </div>

                {/* Context Badges */}
                <div className="flex flex-wrap gap-4 mb-16">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-sm font-semibold">
                    <span className="text-blue-300 mr-2">CYCLE</span> {data.overview.cycleName}
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-sm font-semibold">
                    <span className="text-blue-300 mr-2">SURVEY DATE</span> {data.overview.inspectionDateRange}
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-sm font-semibold">
                    <span className="text-blue-300 mr-2">GENERATED</span> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <button
                    onClick={handleGeneratePdf}
                    disabled={generatingPdf}
                    className="bg-blue-600 hover:bg-blue-500 border border-blue-400/50 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center gap-2 ml-auto"
                  >
                    {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    EXPORT PDF
                  </button>
                </div>

                {/* Hero Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/15 transition-colors">
                    <div className="text-4xl md:text-5xl font-extrabold mb-3">{data.overview.totalRatings.toLocaleString()}</div>
                    <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">TOTAL AUDITS</div>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl p-6 flex flex-col justify-between hover:bg-red-500/30 transition-colors">
                    <div className="text-4xl md:text-5xl font-extrabold text-white mb-3">{data.overview.criticalIssues.toLocaleString()}</div>
                    <div className="text-xs text-red-200 font-bold uppercase tracking-wider">CRITICAL AUDITS</div>
                  </div>
                  <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-2xl p-6 flex flex-col justify-between hover:bg-amber-500/30 transition-colors">
                    <div className="text-4xl md:text-5xl font-extrabold text-white mb-3">{data.issueIntelligence.totalIssues.toLocaleString()}</div>
                    <div className="text-xs text-amber-200 font-bold uppercase tracking-wider">ISSUES IDENTIFIED</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/15 transition-colors">
                    <div className="text-4xl md:text-5xl font-extrabold mb-3">{data.overview.ratedAssets.toLocaleString()}</div>
                    <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">ASSETS ASSESSED</div>
                  </div>
                  <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-2xl p-6 flex flex-col justify-between hover:bg-emerald-500/30 transition-colors">
                    <div className="text-4xl md:text-5xl font-extrabold text-white mb-3">{data.coverage.ratingCoverage}%</div>
                    <div className="text-xs text-emerald-200 font-bold uppercase tracking-wider">NETWORK COVERAGE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── STORY NAVIGATION (STICKY) ─── */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm w-full">
              <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-start gap-8 overflow-x-auto scrollbar-hide">
                {['Health', 'Condition', 'Risk', 'Performance', 'Issues', 'Hotspots', 'Matrix', 'Attention', 'Evidence', 'Insights'].map((item) => (
                  <a 
                    key={item} 
                    href={`#section-${item.toLowerCase().replace(' ', '-')}`}
                    className="text-xs font-bold text-gray-500 hover:text-blue-700 uppercase tracking-wider whitespace-nowrap transition-colors"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* ─── MAIN CONTENT CONTAINER ─── */}
            <div className="max-w-7xl mx-auto w-full px-8 py-16 space-y-24">

              {/* ─── 2. NETWORK HEALTH & COVERAGE ─── */}
              <section id="section-health">
                <SectionHeader title="Network Health & Coverage" subtitle="Inspection completion status across the route" />
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">AUDIT COVERAGE</h3>
                      <p className="text-gray-500 text-sm mt-1">{data.coverage.ratingCoverage}% of the selected network has been audited.</p>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">{data.coverage.ratingCoverage}%</div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${data.coverage.ratingCoverage}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                   <KPICard label="TOTAL AUDITS" value={data.coverage.totalRecords.toLocaleString()} icon={Layers} color="slate" />
                   <KPICard label="COMPLETED" value={data.coverage.ratedRecords.toLocaleString()} icon={CheckSquare} color="green" />
                   <KPICard label="PENDING" value={data.coverage.unratedRecords.toLocaleString()} icon={Clock} color="amber" />
                   <KPICard label="EVIDENCE AVAIL." value={data.coverage.imagesAvailable.toLocaleString()} icon={ImageIcon} color="blue" />
                   <KPICard label="EVIDENCE MISSING" value={data.coverage.imagesMissing.toLocaleString()} icon={ImageOff} color="red" />
                   <KPICard label="ASSETS ASSESSED" value={data.overview.ratedAssets.toLocaleString()} icon={Target} color="blue" />
                </div>
              </section>

              {/* ─── 3. ASSET CONDITION DISTRIBUTION ─── */}
              <section id="section-condition">
                 <SectionHeader title="Asset Condition" subtitle="Distribution of actual inspection condition and severity states" />
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center">
                       <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider w-full text-center">SEVERITY DISTRIBUTION</h3>
                       <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={conditionPieData}
                               cx="50%"
                               cy="50%"
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                               stroke="none"
                             >
                               {conditionPieData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                             </Pie>
                             <Tooltip content={<CustomTooltip />} />
                             <Legend verticalAlign="bottom" height={36} iconType="circle" />
                           </PieChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 gap-6">
                       <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 border-l-4 border-l-emerald-500 flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-1">HEALTHY / GOOD</div>
                            <div className="text-gray-500 font-medium text-sm">Assets operating optimally with no significant issues.</div>
                         </div>
                         <div className="text-right">
                            <div className="text-4xl font-extrabold text-gray-900">{data.condition.good.percentage}%</div>
                            <div className="text-gray-500 font-medium text-sm">{data.condition.good.count.toLocaleString()} Audits</div>
                         </div>
                       </div>
                       <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 border-l-4 border-l-amber-500 flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">MODERATE / ISSUES</div>
                            <div className="text-gray-500 font-medium text-sm">Observations indicating wear or non-critical defects.</div>
                         </div>
                         <div className="text-right">
                            <div className="text-4xl font-extrabold text-gray-900">{data.condition.moderate.percentage}%</div>
                            <div className="text-gray-500 font-medium text-sm">{data.condition.moderate.count.toLocaleString()} Audits</div>
                         </div>
                       </div>
                       <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 border-l-4 border-l-red-600 flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-red-700 uppercase tracking-wider mb-1">CRITICAL</div>
                            <div className="text-gray-500 font-medium text-sm">Severe failures requiring immediate intervention.</div>
                         </div>
                         <div className="text-right">
                            <div className="text-4xl font-extrabold text-gray-900">{data.condition.critical.percentage}%</div>
                            <div className="text-gray-500 font-medium text-sm">{data.condition.critical.count.toLocaleString()} Audits</div>
                         </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* ─── 4. RISK & CRITICALITY ─── */}
              <section id="section-risk">
                <SectionHeader title="Risk & Criticality" subtitle="Overview of highest attention areas and locations" />
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <KPICard 
                    label="CRITICAL AUDITS" 
                    value={<span className="flex items-baseline gap-1">{data.risk.totalCritical.toLocaleString()} <span className="text-xl text-gray-400 font-medium">/ {data.overview.totalRatings.toLocaleString()}</span></span>} 
                    icon={AlertTriangle} color="red" 
                  />
                  <KPICard 
                    label="AFFECTED ASSETS" 
                    value={<span className="flex items-baseline gap-1">{data.risk.criticalAssets.length.toLocaleString()} <span className="text-xl text-gray-400 font-medium">/ {data.assetPerformance.assets.length.toLocaleString()}</span></span>} 
                    icon={Layers} color="amber" 
                  />
                  <KPICard 
                    label="HOTSPOT LOCATIONS" 
                    value={<span className="flex items-baseline gap-1">{data.risk.criticalChainages.length.toLocaleString()} <span className="text-xl text-gray-400 font-medium">/ {data.overview.uniqueChainages.toLocaleString()}</span></span>} 
                    icon={MapPin} color="amber" 
                  />
                  <KPICard 
                    label="CRITICAL PARAMETERS" 
                    value={<span className="flex items-baseline gap-1">{data.risk.criticalParameters.length.toLocaleString()} <span className="text-xl text-gray-400 font-medium">/ {data.issueIntelligence.byParameter.length > 0 ? data.issueIntelligence.byParameter.length.toLocaleString() : '-'}</span></span>} 
                    icon={Activity} color="red" 
                  />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col h-full">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">CRITICAL ASSET CATEGORIES</h3>
                  <p className="text-sm text-gray-500 mb-6">Asset categories ranked by the proportion of audits classified as critical</p>
                  
                  {data.risk.criticalAssets.length > 0 ? (
                    <div className="space-y-4 flex-1">
                      {data.risk.criticalAssets.slice(0, 5).map((a, index) => {
                        const totalAudits = a.total;
                        const criticalAudits = a.critical;
                        const nonCriticalAudits = totalAudits - criticalAudits;
                        const criticalRate = totalAudits > 0 ? ((criticalAudits / totalAudits) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <div key={a.name} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="font-extrabold text-gray-900 text-sm mb-1">#{index + 1} {a.name.toUpperCase()}</div>
                                <div className="text-[11px] text-gray-500 font-bold tracking-wide">
                                  <span title="Number of audits classified as critical">{criticalAudits.toLocaleString()} CRITICAL AUDITS</span> / <span title="Total number of completed audits included for this asset category">{totalAudits.toLocaleString()} TOTAL AUDITS</span>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end justify-start">
                                <div className="text-2xl font-extrabold text-gray-900 leading-none mb-1">{criticalRate}%</div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1" title="Critical Rate is the percentage of total audits within this asset category that are classified as critical.">
                                  CRITICAL RATE <Info className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3 flex overflow-hidden">
                              <div className="h-full bg-red-600 transition-all duration-700" style={{ width: `${criticalRate}%` }} />
                            </div>
                            
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-red-700">{criticalAudits.toLocaleString()} Critical</span>
                              <span className="text-gray-500">{nonCriticalAudits.toLocaleString()} Non-Critical</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">No completed audits found.</div>
                  )}
                </div>
              </section>

              {/* ─── 5. ASSET PERFORMANCE ─── */}
              <section id="section-performance">
                <SectionHeader title="Asset Performance" subtitle="Current inspection performance across asset types" />
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Comprehensive Asset Breakdown</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Detailed performance metrics for all {data.assetPerformance.assets.length} recorded asset types.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white border-b-2 border-gray-100">
                          <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Rank</th>
                          <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Asset Type</th>
                          <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Avg Rating</th>
                          <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total Audits</th>
                          <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Issues</th>
                          <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Critical Audits</th>
                          <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Critical Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.assetPerformance.assets.map((a, i) => renderAssetRow(a, i, 'default'))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ─── 6. ISSUE CONCENTRATION ─── */}
              <section id="section-issues">
                 <SectionHeader title="Issue Concentration" subtitle="Most frequently occurring actual inspection parameters" />

                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                   <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
                     <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Top Issues Identified</h3>
                     <p className="text-[11px] text-gray-500 font-medium">Ranked list of parameters generating the highest volume of issues.</p>
                   </div>
                   
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                       <thead>
                         <tr className="bg-white border-b-2 border-gray-100">
                           <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-16">Rank</th>
                           <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Issue / Parameter</th>
                           <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Affected Audits</th>
                           <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Critical Audits</th>
                           <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Critical Rate</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {data.issueIntelligence.byParameter.slice(0, 15).map((issue, idx) => {
                            const criticalRate = issue.total > 0 ? ((issue.critical / issue.total) * 100).toFixed(1) : '0.0';
                            const isExpanded = expandedIssue === issue.name;
                            return (
                               <React.Fragment key={issue.name}>
                                 <tr className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${isExpanded ? 'bg-blue-50/30' : ''}`} onClick={() => handleIssueClick(issue.name)}>
                                    <td className="px-6 py-4 font-bold text-gray-400 text-xs">
                                      {idx + 1 < 10 ? `0${idx+1}` : idx+1}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center">
                                      <svg className={`w-3 h-3 mr-3 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                      {issue.name}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-amber-600">{issue.total.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-extrabold text-red-600">{issue.critical > 0 ? issue.critical.toLocaleString() : '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-700">{criticalRate}%</td>
                                 </tr>
                                 
                                  {/* Issue Passport */}
                                  {isExpanded && (
                                     <tr>
                                       <td colSpan="5" className="p-0 border-t-0 border-b-2 border-gray-200 shadow-inner bg-gray-50/50 relative">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); setExpandedIssue(null); }}
                                            className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all shadow-xl backdrop-blur-md"
                                          >
                                            <X className="w-5 h-5" />
                                          </button>
                                          <IssuePassport 
                                            issueName={issue.name}
                                            issueStats={issue}
                                            recordsData={recordsData}
                                            loadingRecords={loadingRecords}
                                            recordsError={recordsError}
                                            onAssetClick={(assetType) => {
                                              if (expandedAsset !== assetType) {
                                                handleAssetClick(assetType);
                                              }
                                              document.getElementById('section-performance')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }}
                                          />
                                       </td>
                                     </tr>
                                  )}
                               </React.Fragment>
                            )
                         })}
                       </tbody>
                     </table>
                   </div>
                 </div>
              </section>

              {/* ─── 7. CHAINAGE HOTSPOTS STRIP ─── */}
              <section id="section-hotspots">
                <SectionHeader title="Chainage Hotspots" subtitle="Visual density of actual inspection issues along the route" />
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
                   <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">ROUTE DENSITY STRIP</h3>
                   
                   {data.hotspots.distribution && data.hotspots.distribution.length > 0 ? (
                      <div className="relative pt-10 pb-6">
                         {/* Chainage Bar Background */}
                         <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-100 rounded-full transform -translate-y-1/2 shadow-inner"></div>
                         
                         {/* Route Line */}
                         <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                         
                         {/* Hotspot Markers */}
                         {data.hotspots.distribution.map((bin, idx) => {
                            if (bin.issues === 0) return null;
                            const percentage = ((bin.start - data.hotspots.minChainage) / data.hotspots.totalChainageSpan) * 100;
                            const size = Math.max(12, Math.min(32, bin.issues * 3)); // scale bubble by issues
                            const isCritical = bin.critical > 0;
                            
                            return (
                               <div 
                                 key={idx}
                                 className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 group z-10 cursor-pointer"
                                 style={{ left: `${percentage}%` }}
                               >
                                  {/* Marker */}
                                  <div 
                                    className={`rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125 ${isCritical ? 'bg-red-500' : 'bg-amber-400'}`}
                                    style={{ width: `${size}px`, height: `${size}px`, opacity: 0.8 }}
                                  ></div>
                                  
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50">
                                     <div className="bg-slate-900 text-white text-[10px] rounded py-1.5 px-3 whitespace-nowrap shadow-xl">
                                        <div className="font-black mb-1 text-center">CH {bin.label}</div>
                                        <div className="text-amber-300 font-bold">{bin.issues} Issues</div>
                                        {bin.critical > 0 && <div className="text-red-400 font-bold">{bin.critical} Critical</div>}
                                     </div>
                                     <div className="w-2 h-2 bg-slate-900 transform rotate-45 -mt-1"></div>
                                  </div>
                               </div>
                            )
                         })}
                         
                         {/* Ends Markers */}
                         <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div className="w-4 h-4 bg-slate-800 rounded-full border-2 border-white shadow"></div>
                            <div className="absolute top-full mt-2 text-xs font-black text-gray-500">{data.hotspots.minChainage} km</div>
                         </div>
                         <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
                            <div className="w-4 h-4 bg-slate-800 rounded-full border-2 border-white shadow"></div>
                            <div className="absolute top-full mt-2 text-xs font-black text-gray-500">{data.hotspots.maxChainage} km</div>
                         </div>
                      </div>
                   ) : (
                     <div className="py-12 text-center text-gray-400 font-medium">Insufficient chainage data to generate route strip.</div>
                   )}
                </div>

                {data.hotspots.hotspots.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {data.hotspots.hotspots.map((hs, i) => (
                      <div key={hs.chainageRange} className={`rounded-2xl p-6 border ${i === 0 ? 'bg-red-50 border-red-200 shadow-md' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`text-xs font-extrabold px-3 py-1 rounded-full ${i === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            HOTSPOT #{i + 1}
                          </div>
                          <MapPin className={`w-5 h-5 ${i === 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 mb-1">{hs.chainageRange}</div>
                        <div className="text-sm font-bold text-red-600 mb-3">{hs.critical} Critical Audits</div>
                        <div className="text-sm text-gray-500 font-medium pt-3 border-t border-gray-200/60">
                          Avg Rating: <span className="text-gray-800 font-bold">{hs.avgRating} / 10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ─── 8. ASSET HEALTH OVERVIEW ─── */}
              <section id="section-overview">
                <SectionHeader title="Asset Health Overview" subtitle="Current condition of inspected asset types" />
                
                {(() => {
                  if (!data?.assetPerformance?.assets || data.assetPerformance.assets.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
                        <p className="font-bold text-lg mb-2">NO ASSET DATA AVAILABLE</p>
                        <p>The selected inspection dataset does not contain sufficient asset records for this analysis.</p>
                      </div>
                    );
                  }

                  const assets = data.assetPerformance.assets.map(a => {
                    const total = a.totalRatings || a.total || 0;
                    const critical = a.critical || 0;
                    const rate = total > 0 ? (critical / total) * 100 : 0;
                    return {
                      ...a,
                      name: a.assetType || a.name,
                      total,
                      critical,
                      nonCritical: total - critical,
                      criticalRate: rate,
                      avgRating: a.avgRating || 0
                    };
                  });

                  const totalAssets = assets.length;
                  const totalAudits = assets.reduce((sum, a) => sum + a.total, 0);
                  const totalCritical = assets.reduce((sum, a) => sum + a.critical, 0);

                  const highestCriticalAsset = [...assets].sort((a, b) => b.critical - a.critical)[0];
                  const lowestRatingAsset = [...assets].filter(a => a.avgRating > 0).sort((a, b) => a.avgRating - b.avgRating)[0] || assets[0];

                  const sortedAssets = [...assets].sort((a, b) => {
                    if (overviewSortBy === 'Critical Audits') return b.critical - a.critical;
                    if (overviewSortBy === 'Critical Rate') return b.criticalRate - a.criticalRate;
                    if (overviewSortBy === 'Total Audits') return b.total - a.total;
                    if (overviewSortBy === 'Average Rating') return a.avgRating - b.avgRating; 
                    return b.critical - a.critical;
                  });

                  const renderOverviewAssetRow = (a, i) => {
                    const isExpanded = expandedAsset === a.name;
                    const criticalRate = a.total > 0 ? ((a.critical / a.total) * 100).toFixed(1) : '0.0';
                    const avgRating = parseFloat(a.avgRating || 0).toFixed(1);
                    return (
                      <React.Fragment key={a.name}>
                        <tr 
                          className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                          onClick={() => handleAssetClick(a.name)}
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <svg className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            <span className="truncate max-w-[200px]" title={a.name}>{a.name}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-600">{a.total.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-red-600">{a.critical.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-slate-700 w-12 text-right">{criticalRate}%</span>
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
                                 <div className="h-full bg-red-500" style={{ width: `${criticalRate}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-slate-700 w-8 text-right">{avgRating}</span>
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
                                 <div className={`h-full ${avgRating < 4 ? 'bg-red-500' : avgRating < 7 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${(avgRating / 10) * 100}%` }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="5" className="p-0 border-b border-gray-100 bg-gray-50/50 shadow-inner">
                               <div className="p-6">
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                     <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase">Total Audits</div>
                                        <div className="text-xl font-extrabold text-gray-900">{a.total}</div>
                                     </div>
                                     <div className="bg-red-50 p-4 rounded-lg border border-red-100 shadow-sm">
                                        <div className="text-[10px] font-bold text-red-700 uppercase">Critical Audits</div>
                                        <div className="text-xl font-extrabold text-red-600">{a.critical}</div>
                                     </div>
                                     <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase">Non-Critical</div>
                                        <div className="text-xl font-extrabold text-gray-900">{a.nonCritical}</div>
                                     </div>
                                     <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase">Critical Rate</div>
                                        <div className="text-xl font-extrabold text-gray-900">{criticalRate}%</div>
                                     </div>
                                     <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase">Average Rating</div>
                                        <div className="text-xl font-extrabold text-gray-900">{avgRating} <span className="text-sm text-gray-400">/ 10</span></div>
                                     </div>
                                  </div>

                                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">TOP ISSUES</h4>
                                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-50 text-gray-500 text-[9px] uppercase">
                                        <tr>
                                          <th className="px-4 py-3 text-left font-bold border-b border-gray-200">Parameter</th>
                                          <th className="px-4 py-3 text-right font-bold border-b border-gray-200">Issue Count</th>
                                          <th className="px-4 py-3 text-right font-bold border-b border-gray-200">Critical Audits</th>
                                          <th className="px-4 py-3 text-right font-bold border-b border-gray-200">Critical Rate</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {a.parameters && a.parameters.length > 0 ? (
                                          [...a.parameters].sort((p1, p2) => p2.critical - p1.critical).slice(0, 5).map(p => {
                                            const pCritRate = p.totalRatings > 0 ? ((p.critical / p.totalRatings) * 100).toFixed(1) : '0.0';
                                            return (
                                              <tr key={p.name} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-gray-800">{p.name}</td>
                                                <td className="px-4 py-3 text-right font-bold text-amber-600">{p.issues || 0}</td>
                                                <td className="px-4 py-3 text-right font-extrabold text-red-600">{p.critical || 0}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-700">{pCritRate}%</td>
                                              </tr>
                                            );
                                          })
                                        ) : (
                                          <tr><td colSpan="4" className="px-4 py-4 text-center text-gray-400">No parameter issues found</td></tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="text-right">
                                    <button onClick={(e) => { e.stopPropagation(); document.getElementById('section-performance')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1 ml-auto">
                                      VIEW ALL AUDITS <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  };

                  return (
                    <div className="space-y-8 mb-16">
                      
                      {/* TOP SUMMARY */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KPICard label="TOTAL AUDITS" value={totalAudits.toLocaleString()} icon={ClipboardCheck} color="blue" />
                        <KPICard label="ASSET TYPES" value={totalAssets} icon={Construction} color="slate" />
                        <KPICard label="CRITICAL AUDITS" value={totalCritical.toLocaleString()} icon={TriangleAlert} color="red" />
                      </div>

                      {/* MAIN VIEW - ASSET HEALTH TABLE */}
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">ASSET CONDITION</h3>
                            <p className="text-[11px] text-gray-500 font-medium">Criticality and rating across inspected asset types</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Toggle Chart/Table */}
                            <div className="flex bg-gray-200 rounded-lg p-1">
                               <button onClick={() => setOverviewViewMode('TABLE')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${overviewViewMode === 'TABLE' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>TABLE</button>
                               <button onClick={() => setOverviewViewMode('CHART')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${overviewViewMode === 'CHART' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>CHART</button>
                            </div>

                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">SORT BY:</span>
                              <select 
                                value={overviewSortBy}
                                onChange={(e) => setOverviewSortBy(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-800 border-none outline-none cursor-pointer"
                              >
                                <option value="Critical Audits">Critical Audits</option>
                                <option value="Critical Rate">Critical Rate</option>
                                <option value="Total Audits">Total Audits</option>
                                <option value="Average Rating">Average Rating</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {overviewViewMode === 'TABLE' ? (
                          <>
                            {/* Highlight Rows */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-gray-100 bg-slate-50">
                              {highestCriticalAsset && (
                                <div className="p-5 border-r border-gray-100 flex items-start gap-4">
                                  <div className="bg-red-100 p-2 rounded-lg shrink-0"><TriangleAlert className="w-5 h-5 text-red-600" /></div>
                                  <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">MOST CRITICAL AUDIT COUNT</div>
                                    <div className="text-base font-extrabold text-gray-900 mb-1">{highestCriticalAsset.name}</div>
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                      <span className="text-red-600">{highestCriticalAsset.critical.toLocaleString()} Critical Audits</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600">{highestCriticalAsset.criticalRate.toFixed(1)}% Critical Rate</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600">{highestCriticalAsset.total.toLocaleString()} Total Audits</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {lowestRatingAsset && (
                                <div className="p-5 flex items-start gap-4">
                                  <div className="bg-amber-100 p-2 rounded-lg shrink-0"><TrendingDown className="w-5 h-5 text-amber-600" /></div>
                                  <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">LOWEST AVERAGE RATING</div>
                                    <div className="text-base font-extrabold text-gray-900 mb-1">{lowestRatingAsset.name}</div>
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                      <span className="text-amber-600">{Number(lowestRatingAsset.avgRating).toFixed(1)} / 10</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600">{lowestRatingAsset.critical.toLocaleString()} Critical Audits</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600">{lowestRatingAsset.total.toLocaleString()} Total Audits</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-white border-b border-gray-100">
                                  <tr>
                                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-xs">ASSET TYPE</th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-wider text-xs w-32">AUDITS</th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-wider text-xs w-32">CRITICAL</th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-wider text-xs w-40">RATE</th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-wider text-xs w-40">AVG</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {sortedAssets.map((a, i) => renderOverviewAssetRow(a, i))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div className="p-10">
                            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">Critical Audits by Asset Type</h4>
                            <div className="space-y-6">
                              {[...assets].sort((a,b) => b.critical - a.critical).slice(0, 8).map((a, idx) => {
                                const maxCrit = highestCriticalAsset && highestCriticalAsset.critical > 0 ? highestCriticalAsset.critical : 1;
                                const widthPct = Math.max(1, (a.critical / maxCrit) * 100);
                                
                                return (
                                  <div key={a.name} className="flex items-center gap-6 group">
                                    <div className="w-8 text-right font-bold text-gray-300 text-sm">
                                      {idx + 1 < 10 ? `0${idx+1}` : idx+1}
                                    </div>
                                    <div className="w-48 md:w-64 text-sm font-bold text-slate-800 truncate" title={a.name}>
                                      {a.name}
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                      <div className="flex-1 bg-gray-50 h-8 rounded-md border border-gray-100 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 bottom-0 bg-red-500 transition-all duration-700 ease-out" style={{ width: `${widthPct}%` }}></div>
                                      </div>
                                      <div className="w-40 flex items-baseline justify-end gap-3 shrink-0">
                                        <div className="text-lg font-extrabold text-red-600 leading-none">
                                          {a.critical.toLocaleString()}
                                        </div>
                                        <div className="text-xs font-medium text-gray-400">
                                          / {a.total.toLocaleString()} audits
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-12 pt-6 border-t border-gray-100 flex justify-center">
                              <button onClick={() => setOverviewViewMode('TABLE')} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-6 py-2 rounded-lg transition-colors uppercase flex items-center justify-center gap-2">
                                View Full Table Data <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* ─── 9. ATTENTION AREAS ─── */}
              <section id="section-attention">
                 <SectionHeader title="Attention Areas" subtitle="Assets ranked by deterministic criticality" />
                 
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                   <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                     <div>
                       <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Critical Asset Ranking</h3>
                       <p className="text-[11px] text-gray-500 font-medium">Assets ranked by volume of critical audits.</p>
                     </div>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                       <thead>
                         <tr className="bg-white border-b-2 border-gray-100">
                           <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Rank</th>
                           <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Asset Type</th>
                           <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total Audits</th>
                           <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Critical Audits</th>
                           <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Critical Rate</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {data.risk.criticalAssets.map((a, i) => {
                            const criticalRate = a.total > 0 ? ((a.critical / a.total) * 100).toFixed(1) : '0.0';
                            return (
                               <tr key={a.name} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-gray-400 text-xs">{i + 1 < 10 ? `0${i+1}` : i+1}</td>
                                  <td className="px-6 py-4 font-bold text-gray-900">{a.name}</td>
                                  <td className="px-6 py-4 text-right font-medium text-gray-600">{a.total.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-extrabold text-red-600">{a.critical.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-700">{criticalRate}%</td>
                               </tr>
                            )
                         })}
                       </tbody>
                     </table>
                   </div>
                 </div>
              </section>

              {/* ─── 10. INSPECTION EVIDENCE (Priority Audits) ─── */}
              <section id="section-evidence">
                <SectionHeader title="Inspection Evidence" subtitle="High priority observations with photographic evidence" />
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <h3 className="text-sm font-bold text-gray-800 bg-gray-50 px-8 py-5 border-b border-gray-200 uppercase tracking-wider">TOP PRIORITY AUDITS</h3>
                  {data.risk.criticalObservations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white border-b-2 border-gray-100">
                            <th className="text-left px-8 py-4 font-bold text-gray-500 uppercase tracking-wider w-16">Rank</th>
                            <th className="text-left px-8 py-4 font-bold text-gray-500 uppercase tracking-wider">Chainage</th>
                            <th className="text-left px-8 py-4 font-bold text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="text-left px-8 py-4 font-bold text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="text-right px-8 py-4 font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="text-left px-8 py-4 font-bold text-gray-500 uppercase tracking-wider">Severity</th>
                            <th className="text-center px-8 py-4 font-bold text-gray-500 uppercase tracking-wider w-24">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllEvidence ? data.risk.criticalObservations : data.risk.criticalObservations.slice(0, 10)).map((obs, i) => (
                            <React.Fragment key={`${obs.chainage}-${obs.parameter}-${i}`}>
                              <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${expandedEvidence[i] ? 'bg-blue-50/30' : ''}`}>
                                <td className="px-8 py-4 text-gray-400 font-extrabold">{i + 1}</td>
                                <td className="px-8 py-4 font-extrabold text-gray-900 whitespace-nowrap">{obs.chainage.toFixed(2)} km</td>
                                <td className="px-8 py-4 text-gray-700 font-bold whitespace-nowrap">{obs.assetType}</td>
                                <td className="px-8 py-4 text-gray-700 font-medium truncate max-w-[150px]" title={obs.parameter}>{obs.parameter}</td>
                                <td className="px-8 py-4 text-right">
                                  <span className="font-extrabold text-red-700 text-lg">{obs.score}</span> <span className="text-xs font-bold text-gray-400">/ 10</span>
                                </td>
                                <td className="px-8 py-4">
                                  <span className="text-xs font-extrabold text-red-700 bg-red-100 px-3 py-1.5 rounded-md">CRITICAL</span>
                                </td>
                                <td className="px-8 py-4 text-center">
                                  <button onClick={() => toggleEvidenceExpand(i)} className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 shadow-sm">
                                    {expandedEvidence[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </td>
                              </tr>
                              {expandedEvidence[i] && (
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                  <td colSpan={7} className="p-0">
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-inner">
                                      <div className="md:col-span-1 space-y-5">
                                        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Audit Details</h4>
                                        <div className="grid grid-cols-2 gap-y-4">
                                          <div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Chainage</div>
                                            <div className="font-extrabold text-gray-900">{obs.chainage.toFixed(2)} km</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Direction</div>
                                            <div className="font-extrabold text-gray-900">{obs.direction || '-'}</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Asset</div>
                                            <div className="font-extrabold text-gray-900">{obs.assetType}</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Parameter</div>
                                            <div className="font-extrabold text-gray-900">{obs.parameter}</div>
                                          </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200">
                                          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Remark</div>
                                          <div className="text-sm font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-200">{obs.remark || 'No remark provided'}</div>
                                        </div>
                                      </div>
                                      <div className="md:col-span-2">
                                        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Real Inspection Evidence</h4>
                                        {obs.imageUrl ? (
                                          <div className="rounded-xl overflow-hidden border border-gray-200 bg-black shadow-md relative" style={{ height: '360px' }}>
                                            <img 
                                              src={obs.imageUrl} 
                                              alt="Inspection Evidence" 
                                              className="w-full h-full object-contain" 
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                              }} 
                                            />
                                            <div className="hidden flex-col items-center justify-center p-8 text-center absolute inset-0 bg-gray-50">
                                              <Camera className="w-12 h-12 text-gray-300 mb-4" />
                                              <span className="text-gray-800 font-bold text-lg mb-1">Evidence image unavailable</span>
                                              <span className="text-sm font-medium text-gray-500">Reason: Image mapping/extraction issue</span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white h-[360px] flex flex-col items-center justify-center p-8 text-center">
                                            <Camera className="w-12 h-12 text-gray-300 mb-4" />
                                            <span className="text-gray-800 font-bold text-lg mb-1">Evidence image unavailable</span>
                                            <span className="text-sm font-medium text-gray-500">Reason: No evidence attached to audit</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
                      <p className="font-bold text-lg">No critical audits found for the current selection.</p>
                    </div>
                  )}
                  {data.risk.criticalObservations.length > 10 && (
                    <div className="bg-white px-8 py-5 border-t border-gray-200 flex justify-center">
                      <button 
                        onClick={() => setShowAllEvidence(!showAllEvidence)}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-800 rounded-lg transition-colors border border-gray-200 shadow-sm"
                      >
                        {showAllEvidence ? "Show Less" : `View All (${data.risk.criticalObservations.length} Priority Audits)`}
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* ─── 11. EXECUTIVE INSIGHTS ─── */}
              <section id="section-insights">
                <SectionHeader title="Executive Insights" subtitle="Key findings from the selected inspection dataset" />

                {/* 1. INSPECTION SNAPSHOT */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
                  <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" /> INSPECTION SNAPSHOT
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Folder className="w-3 h-3"/> PROJECT</div>
                      <div className="text-sm font-extrabold text-slate-900 truncate" title={data.overview.projectName}>{data.overview.projectName}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ClipboardList className="w-3 h-3"/> DATASET</div>
                      <div className="text-sm font-extrabold text-slate-900 truncate" title={data.overview.cycleName}>{data.overview.cycleName}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Route className="w-3 h-3"/> ROAD TYPE</div>
                      <div className="text-sm font-extrabold text-slate-900">{data.metadata?.roadType || roadType || 'Both'}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ArrowLeftRight className="w-3 h-3"/> DIRECTION</div>
                      <div className="text-sm font-extrabold text-slate-900">{data.metadata?.direction || direction || 'Both'}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> CHAINAGE</div>
                      <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">{data.hotspots.minChainage.toFixed(2)} – {data.hotspots.maxChainage.toFixed(2)} km</div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ClipboardCheck className="w-3 h-3"/> AUDITS</div>
                      <div className="text-sm font-extrabold text-slate-900">{data.overview.totalRatings.toLocaleString()}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Construction className="w-3 h-3"/> ASSETS</div>
                      <div className="text-sm font-extrabold text-slate-900">{data.overview.ratedAssets.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* 2. OVERALL CONDITION */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
                  <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-blue-600" /> OVERALL CONDITION
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1">Current condition across the selected inspection dataset</p>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="text-center md:text-left">
                        <div className="text-5xl font-black text-slate-900 mb-1">
                          {data.condition.averageRating} <span className="text-2xl text-gray-400 font-bold">/ 10</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Average rating</p>
                      </div>
                      
                      <div className="flex-1 w-full max-w-2xl">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-emerald-700">GOOD</span>
                          <span className="text-amber-600">MODERATE</span>
                          <span className="text-red-600">CRITICAL</span>
                        </div>
                        
                        <div className="w-full h-4 flex rounded-full overflow-hidden mb-2 shadow-inner bg-gray-100">
                          <div className="bg-emerald-500" style={{ width: `${data.condition.good.percentage}%` }}></div>
                          <div className="bg-amber-400" style={{ width: `${data.condition.moderate.percentage}%` }}></div>
                          <div className="bg-red-500" style={{ width: `${data.condition.critical.percentage}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between text-[11px] font-bold text-gray-500">
                          <span className="w-1/3 text-left">{data.condition.good.percentage}% ({data.condition.good.count.toLocaleString()})</span>
                          <span className="w-1/3 text-center">{data.condition.moderate.percentage}% ({data.condition.moderate.count.toLocaleString()})</span>
                          <span className="w-1/3 text-right">{data.condition.critical.percentage}% ({data.condition.critical.count.toLocaleString()})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. INSPECTION HIGHLIGHTS */}
                <div className="mb-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" /> INSPECTION HIGHLIGHTS
                    </h3>
                    <p className="text-sm text-gray-500">Key results from the selected inspection dataset</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* INSIGHT CARD 01 — CRITICAL AUDITS */}
                    <a href="#section-risk" className="group bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-red-300 hover:shadow-md transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-50 to-transparent opacity-50 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                          <TriangleAlert className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">CRITICAL AUDITS</span>
                      </div>
                      <div className="mb-2">
                        <div className="text-4xl font-black text-slate-900">{data.risk.totalCritical.toLocaleString()}</div>
                        <div className="text-lg font-bold text-red-600">{data.overview.totalRatings > 0 ? ((data.risk.totalCritical / data.overview.totalRatings) * 100).toFixed(1) : 0}%</div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium mb-6">of affected audit records</div>
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                        <span>View Critical Audits</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </a>

                    {/* INSIGHT CARD 02 — MOST AFFECTED ASSET */}
                    {(() => {
                      const topAsset = data.risk.criticalAssets.length > 0 ? data.risk.criticalAssets[0] : null;
                      return (
                        <a href="#section-attention" className="group bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-amber-300 hover:shadow-md transition-all relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-50 to-transparent opacity-50 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                              <Construction className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">MOST AFFECTED ASSET</span>
                          </div>
                          <div className="mb-2">
                            <div className="text-2xl font-black text-slate-900 leading-tight mb-2 max-w-[90%] break-words">{topAsset ? topAsset.name : 'N/A'}</div>
                            <div className="text-lg font-bold text-amber-600">{topAsset ? topAsset.critical.toLocaleString() : 0}</div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium mb-6">Critical audits</div>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                            <span>View Asset</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      );
                    })()}

                    {/* INSIGHT CARD 03 — CRITICAL HOTSPOT */}
                    {(() => {
                      const topHotspot = data.hotspots.hotspots.length > 0 ? data.hotspots.hotspots[0] : null;
                      return (
                        <a href="#section-hotspots" className="group bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-blue-300 hover:shadow-md transition-all relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent opacity-50 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                           <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                              <MapPinned className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">CRITICAL HOTSPOT</span>
                          </div>
                          <div className="mb-2">
                            <div className="text-2xl font-black text-slate-900 leading-tight mb-2">{topHotspot ? `${topHotspot.chainageRange} km` : 'N/A'}</div>
                            <div className="text-sm font-bold text-blue-600">Highest concentration</div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium mb-6">Critical audit records</div>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                            <span>View Location</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      );
                    })()}

                    {/* INSIGHT CARD 04 — LOWEST RATING */}
                    {(() => {
                      const lowestRecord = data.risk.criticalObservations.length > 0 
                        ? data.risk.criticalObservations.reduce((prev, curr) => (prev.score < curr.score ? prev : curr))
                        : null;
                      return (
                        <a href="#section-evidence" className="group bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-red-300 hover:shadow-md transition-all relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-50 to-transparent opacity-50 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                           <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                              <TrendingDown className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">LOWEST RATING FOUND</span>
                          </div>
                          <div className="mb-4">
                            <div className="text-4xl font-black text-slate-900 flex items-end gap-1">
                              {lowestRecord ? lowestRecord.score : 'N/A'} <span className="text-xl text-gray-400 font-bold mb-1">/ 10</span>
                            </div>
                            <div className="w-full flex items-center gap-2 mt-2">
                              <div className="text-[10px] font-bold text-gray-400">0</div>
                              <div className="flex-1 h-1 bg-gray-200 rounded-full relative">
                                {lowestRecord && <div className="absolute top-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white transform -translate-y-1/2 -translate-x-1/2 shadow-sm" style={{ left: `${(lowestRecord.score / 10) * 100}%` }}></div>}
                              </div>
                              <div className="text-[10px] font-bold text-gray-400">10</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium space-y-1.5 mb-6">
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0"/> <span className="font-bold text-gray-700 truncate">{lowestRecord ? `${lowestRecord.chainage.toFixed(2)} km` : 'N/A'}</span></div>
                            <div className="flex items-center gap-1.5"><Construction className="w-3.5 h-3.5 text-gray-400 shrink-0"/> <span className="font-bold text-gray-700 truncate" title={lowestRecord?.assetType}>{lowestRecord ? lowestRecord.assetType : 'N/A'}</span></div>
                            <div className="flex items-center gap-1.5"><CircleAlert className="w-3.5 h-3.5 text-gray-400 shrink-0"/> <span className="font-bold text-gray-700 truncate" title={lowestRecord?.parameter}>{lowestRecord ? lowestRecord.parameter : 'N/A'}</span></div>
                            <div className="flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 shrink-0"/> <span className="font-bold text-gray-700 truncate">{lowestRecord?.direction || 'N/A'}</span></div>
                          </div>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                            <span>View Audit</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      );
                    })()}
                    
                    {/* OPTIONAL EVIDENCE CARD */}
                    {data.evidence && data.risk.totalCritical > 0 && (() => {
                      const evidenceAvailable = data.evidence.totalCriticalWithImage;
                      const coveragePercent = ((evidenceAvailable / data.risk.totalCritical) * 100).toFixed(1);
                      return (
                        <a href="#section-evidence" className="group bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-100 to-transparent opacity-50 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                           <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">INSPECTION EVIDENCE</span>
                          </div>
                          <div className="mb-2">
                            <div className="text-4xl font-black text-slate-900">{coveragePercent}%</div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium mb-6">Critical audits with evidence</div>
                          
                          <div className="space-y-2 mb-6 text-xs font-medium">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5 text-emerald-500"/> <span className="text-gray-700">Evidence Available</span></div>
                               <span className="font-bold text-emerald-600">{evidenceAvailable.toLocaleString()}</span>
                             </div>
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-1.5"><ImageOff className="w-3.5 h-3.5 text-red-400"/> <span className="text-gray-700">Evidence Missing</span></div>
                               <span className="font-bold text-red-500">{data.evidence.totalCriticalWithoutImage.toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                            <span>View Evidence</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      )
                    })()}

                  </div>
                </div>
              </section>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceCenterModal;