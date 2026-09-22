import React, { useState, useMemo } from 'react';
import { X, Activity, Layers, MapPin, Camera, AlertTriangle, Shield, CheckCircle, Info, FileText, ChevronLeft, ChevronRight, List } from 'lucide-react';

const IssuePassport = ({ issueName, passportStats: propPassportStats, recordsData, loadingRecords, recordsError, onAssetClick, onClose }) => {
  const [chainageFilter, setChainageFilter] = useState('All');
  
  // States for chainage intelligence interaction
  const [selectedBin, setSelectedBin] = useState(null);
  const [viewBinRecords, setViewBinRecords] = useState(false);
  const [binRecordPage, setBinRecordPage] = useState(1);
  const RECORDS_PER_PAGE = 5;

  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.includes('res.cloudinary.com')) return `https://${url}`;
    
    // Fallback for local files based on backend API URL if available
    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5555';
    return `${backendUrl}/uploads/${url}`;
  };

  // Aggregated calculations based strictly on recordsData
  const passportStats = useMemo(() => {
    if (!recordsData || recordsData.length === 0) return propPassportStats || null;

    let criticalCount = 0;
    let nonCriticalCount = 0;
    let sumRating = 0;
    let lowestRating = 10;
    const assetMap = {};
    const chainageValues = [];

    recordsData.forEach(r => {
      const isCritical = r.status === 'Critical';
      const rating = Number(r.rating) || 0;

      if (isCritical) criticalCount++;
      else nonCriticalCount++;

      sumRating += rating;
      if (rating < lowestRating) lowestRating = rating;

      // Group by Asset
      const aType = r.assetType || 'Unknown';
      if (!assetMap[aType]) {
        assetMap[aType] = { total: 0, critical: 0, sumScore: 0 };
      }
      assetMap[aType].total++;
      if (isCritical) assetMap[aType].critical++;
      assetMap[aType].sumScore += rating;

      const ch = parseFloat(r.chainage);
      if (!isNaN(ch)) {
        chainageValues.push(ch);
      }
    });

    const totalAudits = recordsData.length;
    const avgRating = totalAudits > 0 ? (sumRating / totalAudits).toFixed(1) : 0;
    const criticalRate = totalAudits > 0 ? ((criticalCount / totalAudits) * 100).toFixed(1) : '0.0';

    const affectedAssets = Object.keys(assetMap).map(assetType => {
      const a = assetMap[assetType];
      return {
        assetType,
        total: a.total,
        critical: a.critical,
        criticalRate: ((a.critical / a.total) * 100).toFixed(1),
        avgRating: (a.sumScore / a.total).toFixed(1)
      };
    }).sort((a, b) => b.critical - a.critical);

    // Dynamic Chainage Binning Logic
    const minChainage = chainageValues.length > 0 ? Math.min(...chainageValues) : 0;
    const maxChainage = chainageValues.length > 0 ? Math.max(...chainageValues) : 0;
    const span = maxChainage - minChainage || 1; // avoid division by zero
    
    let binSize = 1;
    if (span <= 1) binSize = 0.1;
    else if (span <= 5) binSize = 0.5;
    else if (span <= 20) binSize = 1;
    else if (span <= 50) binSize = 2;
    else if (span <= 100) binSize = 5;
    else binSize = 10;

    const startBin = Math.floor(minChainage / binSize) * binSize;
    const endBin = Math.ceil(maxChainage / binSize) * binSize;
    
    const bins = [];
    for (let i = startBin; i < endBin + 0.0001; i += binSize) {
      bins.push({
        id: `bin_${i}`,
        start: parseFloat(i.toFixed(2)),
        end: parseFloat((i + binSize).toFixed(2)),
        total: 0,
        critical: 0,
        nonCritical: 0,
        sumRating: 0,
        assets: new Set(),
        records: []
      });
    }

    let highConcentrationZones = 0;

    recordsData.forEach(r => {
      const isCritical = r.status === 'Critical';
      const rating = Number(r.rating) || 0;
      const ch = parseFloat(r.chainage);
      if (!isNaN(ch)) {
        let binIndex = bins.findIndex(b => ch >= b.start && ch < b.end);
        if (binIndex === -1 && ch === bins[bins.length-1].end) binIndex = bins.length - 1;
        
        if (binIndex !== -1) {
          const b = bins[binIndex];
          b.total++;
          if (isCritical) b.critical++;
          else b.nonCritical++;
          b.sumRating += rating;
          b.assets.add(r.assetType || 'Unknown');
          b.records.push(r);
        }
      }
    });

    const activeBins = bins.filter(b => b.total > 0);
    const avgIssuesPerBin = activeBins.length > 0 ? activeBins.reduce((acc, b) => acc + b.total, 0) / activeBins.length : 0;
    
    bins.forEach(b => {
      b.isHighConcentration = b.total > avgIssuesPerBin && b.total > 1;
      if (b.isHighConcentration) highConcentrationZones++;
      b.avgRating = b.total > 0 ? (b.sumRating / b.total).toFixed(1) : 0;
      b.assetList = Array.from(b.assets);
      b.criticalRate = b.total > 0 ? ((b.critical / b.total) * 100).toFixed(1) : '0.0';
    });

    return {
      totalAudits,
      criticalCount,
      nonCriticalCount,
      avgRating,
      lowestRating,
      criticalRate,
      affectedAssets,
      bins,
      startBin,
      endBin,
      highConcentrationZones
    };
  }, [recordsData]);

  if (loadingRecords) {
    return (
      <div className="p-12 flex flex-col justify-center items-center bg-white border-t border-gray-200">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Issue Intelligence...</p>
      </div>
    );
  }

  if (recordsError) {
    return (
      <div className="p-8 text-center bg-red-50 border-t border-red-100">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{recordsError}</p>
      </div>
    );
  }

  if (!passportStats || !recordsData || recordsData.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border-t border-gray-200 text-sm font-bold text-gray-500 uppercase">
        No records found for this issue.
      </div>
    );
  }

  const filteredRecords = recordsData.filter(rec => chainageFilter === 'All' || rec.status === chainageFilter);

  // Generate dynamic factual string
  const uniqueAssetTypes = passportStats.affectedAssets.map(a => a.assetType);
  const assetString = uniqueAssetTypes.length === 1 
    ? uniqueAssetTypes[0] 
    : uniqueAssetTypes.length === 2 
      ? `${uniqueAssetTypes[0]} and ${uniqueAssetTypes[1]}` 
      : `${uniqueAssetTypes.length} different asset types`;

  // Paginated records for selected bin
  const paginatedBinRecords = selectedBin ? selectedBin.records.slice((binRecordPage - 1) * RECORDS_PER_PAGE, binRecordPage * RECORDS_PER_PAGE) : [];
  const totalBinPages = selectedBin ? Math.ceil(selectedBin.records.length / RECORDS_PER_PAGE) : 0;

  return (
    <div className="w-full bg-slate-50 border-t border-gray-200 pb-12">
      <div className="max-w-[1600px] mx-auto p-8 md:p-12 space-y-12">
        
        {/* ─── 1. ISSUE SUMMARY ─── */}
        <section>
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" /> ISSUE SUMMARY
            </h4>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {issueName}
            </h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Affected Audits</span>
                <span className="text-3xl font-extrabold text-slate-800">{passportStats.totalAudits.toLocaleString()}</span>
              </div>
              <div className="flex flex-col pl-6">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Critical Audits</span>
                <span className="text-3xl font-extrabold text-red-600">{passportStats.criticalCount.toLocaleString()}</span>
              </div>
              <div className="flex flex-col pl-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Critical Rate</span>
                <span className="text-3xl font-extrabold text-slate-800">{passportStats.criticalRate}%</span>
              </div>
              <div className="flex flex-col pl-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Average Rating</span>
                <span className="text-3xl font-extrabold text-slate-800">{passportStats.avgRating} <span className="text-base text-gray-400">/ 10</span></span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">INSPECTION FINDING</h5>
              <p className="text-sm text-slate-700 font-medium leading-relaxed max-w-4xl">
                {passportStats.criticalCount.toLocaleString()} critical audit records were identified for this issue within the selected inspection dataset. 
                This issue affects {assetString} across {passportStats.highConcentrationZones} high-concentration zones along the network.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ─── 2. CRITICALITY PROFILE ─── */}
          <section className="xl:col-span-1">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-red-500" /> CRITICALITY PROFILE
            </h4>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center gap-6">
              
              {/* Distribution Bar */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audit Distribution</span>
                </div>
                <div className="w-full flex h-4 rounded-full overflow-hidden mb-2 shadow-inner">
                  <div className="bg-red-500" style={{ width: `${passportStats.criticalRate}%` }}></div>
                  <div className="bg-slate-200" style={{ width: `${100 - passportStats.criticalRate}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] font-bold mt-2">
                  <span className="text-red-600">{passportStats.criticalCount} Critical ({passportStats.criticalRate}%)</span>
                  <span className="text-slate-500">{passportStats.nonCriticalCount} Non-Critical</span>
                </div>
              </div>

              {/* Rating Extremes Removed per user request */}

            </div>
          </section>

          {/* ─── 3. AFFECTED ASSETS ─── */}
          <section className="xl:col-span-2">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> AFFECTED ASSETS
            </h4>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm h-full">
              <div className="overflow-x-auto max-h-[350px] custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Asset Type</th>
                      <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Avg Rating</th>
                      <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Total Audits</th>
                      <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Critical Audits</th>
                      <th className="text-right px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Critical Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {passportStats.affectedAssets.map(a => (
                      <tr key={a.assetType} className="hover:bg-blue-50/50 cursor-pointer transition-colors group" onClick={() => onAssetClick && onAssetClick(a.assetType)}>
                        <td className="px-6 py-4 font-bold text-gray-900 whitespace-normal group-hover:text-blue-700">{a.assetType}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{a.avgRating} <span className="text-[10px] text-gray-400">/ 10</span></td>
                        <td className="px-6 py-4 text-right font-medium text-gray-600">{a.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-red-600">{a.critical > 0 ? a.critical.toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-700">{a.criticalRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* ─── 4. ISSUE LOCATION INTELLIGENCE ─── */}
        <section>
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> ISSUE LOCATION INTELLIGENCE
          </h4>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            
            {/* Summary Row */}
            <div className="flex flex-wrap items-center justify-between gap-8 mb-10 border-b border-gray-100 pb-6">
               <div className="flex flex-wrap gap-8">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL AFFECTED</span>
                   <span className="text-lg font-black text-slate-800">{passportStats.totalAudits.toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CRITICAL</span>
                   <span className="text-lg font-black text-red-600">{passportStats.criticalCount.toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CHAINAGE RANGE</span>
                   <span className="text-lg font-black text-slate-800">{passportStats.startBin.toFixed(2)} – {passportStats.endBin.toFixed(2)} km</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">HIGH-CONCENTRATION ZONES</span>
                   <span className="text-lg font-black text-amber-600">{passportStats.highConcentrationZones}</span>
                 </div>
               </div>

               {/* Concentration Legend */}
               <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded bg-slate-300"></div>
                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded bg-amber-400"></div>
                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded bg-red-500"></div>
                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Critical</span>
                  </div>
               </div>
            </div>

            {/* Visual Strip */}
            <div className="relative pt-6 pb-6 overflow-x-auto custom-scrollbar">
               <div className="min-w-[800px]">
                  
                  {/* Axis line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 z-0"></div>
                  
                  {/* Ends */}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white pr-2 z-10 flex flex-col items-center">
                    <div className="w-3 h-8 bg-slate-800 rounded-sm"></div>
                    <div className="absolute top-full mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">START {passportStats.startBin.toFixed(2)}</div>
                  </div>
                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white pl-2 z-10 flex flex-col items-center">
                    <div className="w-3 h-8 bg-slate-800 rounded-sm"></div>
                    <div className="absolute top-full mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">END {passportStats.endBin.toFixed(2)}</div>
                  </div>

                  {/* Segments */}
                  <div className="relative h-12 mx-4 z-20 flex">
                     {passportStats.bins.map((bin) => {
                        const isSelected = selectedBin?.id === bin.id;
                        const widthPct = ((bin.end - bin.start) / (passportStats.endBin - passportStats.startBin)) * 100;
                        
                        let colorClass = 'bg-transparent';
                        let hoverClass = 'hover:bg-gray-200';
                        let opacity = 'opacity-0';

                        if (bin.total > 0) {
                           opacity = 'opacity-100';
                           if (!bin.isHighConcentration) {
                              colorClass = 'bg-slate-300';
                              hoverClass = 'hover:bg-slate-400';
                           } else {
                              if (bin.critical > 0 && (bin.critical / bin.total) >= 0.3) {
                                 colorClass = 'bg-red-500';
                                 hoverClass = 'hover:bg-red-600';
                              } else {
                                 colorClass = 'bg-amber-400';
                                 hoverClass = 'hover:bg-amber-500';
                              }
                           }
                        }

                        if (isSelected) {
                          hoverClass = colorClass; // Keep current color but add border
                        }

                        return (
                           <div 
                              key={bin.id} 
                              className={`h-full flex items-center justify-center relative cursor-pointer transition-all duration-200 ${isSelected ? 'scale-110 z-30' : 'z-20 hover:scale-105'} ${bin.total === 0 ? 'pointer-events-none' : ''}`}
                              style={{ width: `${widthPct}%` }}
                              onClick={() => {
                                 if (bin.total > 0) {
                                    if (selectedBin?.id === bin.id) {
                                      setSelectedBin(null);
                                      setViewBinRecords(false);
                                    } else {
                                      setSelectedBin(bin);
                                      setViewBinRecords(false);
                                      setBinRecordPage(1);
                                    }
                                 }
                              }}
                           >
                              {/* Visible Bar */}
                              <div className={`w-full h-4 mx-[1px] rounded ${colorClass} ${hoverClass} ${opacity} transition-colors ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}></div>
                              
                              {/* Count Label (only on high concentration) */}
                              {bin.isHighConcentration && bin.total > 0 && widthPct > 2 && (
                                <div className={`absolute bottom-full mb-2 bg-white border shadow-sm px-1.5 py-0.5 rounded text-[9px] font-black whitespace-nowrap transition-transform ${isSelected ? 'border-blue-500 text-blue-600 scale-110' : 'border-gray-200 text-gray-600'}`}>
                                  {bin.total}
                                </div>
                              )}
                           </div>
                        )
                     })}
                  </div>
               </div>
            </div>

            {/* Expansion Detail Panel */}
            {selectedBin && (
               <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-6 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                     <div>
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                           <MapPin className="w-3 h-3" /> SELECTED CHAINAGE
                        </div>
                        <div className="text-2xl font-black text-slate-800">
                           {selectedBin.start.toFixed(2)} – {selectedBin.end.toFixed(2)} <span className="text-sm font-bold text-gray-500">km</span>
                        </div>
                     </div>
                     <div className="flex gap-4 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Affected</span>
                           <span className="text-base font-black text-slate-800">{selectedBin.total}</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Critical</span>
                           <span className="text-base font-black text-red-600">{selectedBin.critical}</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Critical Rate</span>
                           <span className="text-base font-black text-slate-800">{selectedBin.criticalRate}%</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Avg Rating</span>
                           <span className="text-base font-black text-slate-800">{selectedBin.avgRating}</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => setViewBinRecords(!viewBinRecords)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 shrink-0"
                     >
                        <List className="w-4 h-4" /> 
                        {viewBinRecords ? 'Hide Records' : 'View Affected Records'}
                     </button>
                  </div>

                  {/* Asset breakdown tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 mr-2">Affected Assets:</span>
                     {selectedBin.assetList.map(a => (
                        <span key={a} className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">{a}</span>
                     ))}
                  </div>

                  {/* Paginated Data Table */}
                  {viewBinRecords && (
                     <div className="mt-6 border-t border-blue-100 pt-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                           <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                 <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[9px] tracking-wider border-b border-gray-200">
                                    <tr>
                                       <th className="px-4 py-3">Chainage</th>
                                       <th className="px-4 py-3">Asset Type</th>  
                                       <th className="px-4 py-3">Rating</th>
                                       <th className="px-4 py-3">Status</th>
                                       <th className="px-4 py-3">Dir</th>
                                       <th className="px-4 py-3">Road Type</th>
                                       <th className="px-4 py-3 w-1/3">Remark</th>
                                       <th className="px-4 py-3 text-center">Evidence</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                    {paginatedBinRecords.map((r, i) => (
                                       <tr key={i} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 font-bold text-gray-900">{r.chainage}</td>
                                          <td className="px-4 py-3 font-bold text-gray-700">{r.assetType}</td>
                                          <td className="px-4 py-3 font-black text-slate-800">{r.rating}/10</td>
                                          <td className="px-4 py-3">
                                             <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${r.status === 'Critical' ? 'bg-red-100 text-red-700' : r.status === 'Observation' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                {r.status}
                                             </span>
                                          </td>
                                          <td className="px-4 py-3 text-gray-600">{r.direction}</td>
                                          <td className="px-4 py-3 text-gray-600">{r.roadType || '-'}</td>
                                          <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate" title={r.remark}>{r.remark || '-'}</td>
                                          <td className="px-4 py-3 text-center">
                                             {r.evidence ? (
                                                <a href={r.evidence} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-[9px] uppercase tracking-wider">
                                                   <Camera className="w-3 h-3" /> View
                                                </a>
                                             ) : (
                                                <span className="text-gray-300">-</span>
                                             )}
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                           
                           {/* Pagination Controls */}
                           {totalBinPages > 1 && (
                              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                                 <span className="text-xs font-bold text-gray-500">
                                    Showing {(binRecordPage - 1) * RECORDS_PER_PAGE + 1} to {Math.min(binRecordPage * RECORDS_PER_PAGE, selectedBin.records.length)} of {selectedBin.records.length}
                                 </span>
                                 <div className="flex items-center gap-2">
                                    <button 
                                       onClick={() => setBinRecordPage(p => Math.max(1, p - 1))}
                                       disabled={binRecordPage === 1}
                                       className="p-1 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                                    >
                                       <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-bold text-gray-700">Page {binRecordPage} of {totalBinPages}</span>
                                    <button 
                                       onClick={() => setBinRecordPage(p => Math.min(totalBinPages, p + 1))}
                                       disabled={binRecordPage === totalBinPages}
                                       className="p-1 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                                    >
                                       <ChevronRight className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            )}
          </div>
        </section>

        {/* ─── 5. TRACEABLE EVIDENCE ─── */}
        <section>
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" /> ISSUE EVIDENCE
            </h4>
            <div className="flex items-center gap-1 border border-gray-200 rounded p-0.5 bg-white shadow-sm">
              {['All', 'Critical', 'Observation', 'Good'].map(f => (
                <button 
                  key={f}
                  onClick={() => setChainageFilter(f)}
                  className={`px-3 py-1 rounded text-[10px] font-bold tracking-wide uppercase transition-colors ${chainageFilter === f ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            {filteredRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredRecords.slice(0, 50).map((rec, rIdx) => (
                  <div key={rIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col group">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-2">
                          <div className="bg-white border border-gray-200 shadow-sm rounded text-slate-800 font-black text-sm px-2 py-1">CH {rec.chainage}</div>
                          <span className="text-[10px] font-bold text-gray-400">{rec.direction}</span>
                       </div>
                       <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${rec.status === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' : rec.status === 'Observation' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                         {rec.status}
                       </span>
                    </div>
                    
                    <div className="text-xs font-bold text-gray-900 mb-1">{rec.assetType}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">Rating: <span className="text-gray-800">{rec.rating}/10</span></div>
                    
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic mb-4 flex-1">
                      {rec.remark && rec.remark !== '-' && rec.remark !== 'No remarks provided' ? `"${rec.remark}"` : 'No remark provided'}
                    </p>
                    
                    {rec.evidence ? (
                      <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mt-auto relative group">
                        <img src={formatImageUrl(rec.evidence)} alt="Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <a href={formatImageUrl(rec.evidence)} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">View Full</span>
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 border border-dashed border-gray-300 rounded-lg mt-auto flex flex-col items-center justify-center text-gray-400">
                        <Camera className="w-6 h-6 mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Evidence Unavailable</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs font-bold uppercase">No evidence records found for this filter.</div>
            )}
            {filteredRecords.length > 50 && (
               <div className="text-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing top 50 evidence records. Select a specific chainage zone above to view localized records.</span>
               </div>
            )}
          </div>
        </section>


      </div>
    </div>
  );
};

export default IssuePassport;
