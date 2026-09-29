import json
import re

file_path = r'C:\Users\hp\Desktop\Hirate report\Ship\frontend\src\pages\Reports\PerformanceCenterModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the entire Asset Performance section (from <section id="section-asset-performance"> to </section>)
new_section = '''              <section id="section-asset-performance">
                <SectionHeader title="Asset Performance" subtitle="Current inspection performance across asset types" />
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <KPICard label="ASSET TYPES" value={data.assetPerformance.assets.length.toLocaleString()} color="blue" />
                  <KPICard label="TOTAL AUDITS" value={data.overview.totalRatings.toLocaleString()} color="blue" />
                  <KPICard label="AVG RATING" value={`${data.overview.averageRating} / 10`} color="green" />
                  <KPICard label="ISSUES" value={data.issueIntelligence.totalIssues.toLocaleString()} color="amber" />
                  <KPICard label="CRITICAL AUDITS" value={data.risk.totalCritical.toLocaleString()} color="red" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                  {/* Top Critical Assets Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Top Critical Assets</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Assets requiring attention based on critical audit count.</p>
                    </div>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left">
                        <thead className="bg-white border-b-2 border-gray-100">
                          <tr>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Rank</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Asset Type</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Avg Rating</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Total Audits</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Issues</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Critical</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top5Critical.map((a, i) => renderAssetRow(a, i, 'default'))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Asset Condition Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Asset Condition by Rating</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Lowest rated assets based on average inspection score.</p>
                    </div>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left">
                        <thead className="bg-white border-b-2 border-gray-100">
                          <tr>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Rank</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Asset Type</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Avg Rating</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Total Audits</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Critical</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Rate</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] text-right">Condition</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top5Condition.map((a, i) => renderAssetRow(a, i, 'condition'))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* View All: Comprehensive Table */}
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
              </section>'''

# Need to find the section
pattern = re.compile(r'(\s*<section id="section-asset-performance">.*?</section>)', re.DOTALL)
content = pattern.sub(new_section, content)

# 2. Add the logic hooks (renderAssetRow, top5Critical, top5Condition)
logic_hooks = '''  const toggleEvidenceExpand = (index) => {
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

  const renderAssetRow = (a, i, viewType = 'default') => {
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
      <React.Fragment key={a.assetType}>
        <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${isExpanded ? 'bg-blue-50/30' : ''}`} onClick={() => handleAssetClick(a.assetType)}>
          <td className="px-4 py-3 text-gray-400 font-bold whitespace-nowrap text-[11px] md:text-xs">#{i + 1}</td>
          <td className="px-4 py-3 font-bold text-gray-900 flex items-center">
            <svg className={`w-3.5 h-3.5 mr-2 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            <span className="break-words leading-tight text-[11px] md:text-xs max-w-[120px] md:max-w-[200px] whitespace-normal">{a.assetType}</span>
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
          ) : (
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-gray-900 text-[11px] md:text-sm">{parseFloat(a.avgRating).toFixed(1)}</span> <span className="text-[9px] text-gray-400">/ 10</span>
            </td>
          )}
          <td className="px-4 py-3 text-right font-medium text-gray-600 text-[11px] md:text-xs">{a.totalRatings.toLocaleString()}</td>
          {viewType !== 'condition' && <td className="px-4 py-3 text-right font-bold text-amber-600 text-[11px] md:text-xs">{a.issues > 0 ? a.issues.toLocaleString() : '-'}</td>}
          <td className="px-4 py-3 text-right font-extrabold text-red-600 text-[11px] md:text-xs">{a.critical > 0 ? a.critical.toLocaleString() : '-'}</td>
          <td className="px-4 py-3 text-right font-bold text-gray-700 text-[11px] md:text-xs">{criticalRate}%</td>
          {viewType === 'condition' && <td className="px-4 py-3 text-right">{conditionBadge}</td>}
        </tr>
        
        {isExpanded && (
          <tr>
            <td colSpan={viewType === 'condition' ? "7" : "7"} className="p-0 border-b border-gray-100 bg-gray-50/50 shadow-inner">
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
                                onClick={(e) => { e.stopPropagation(); handleParameterClick(a.assetType, p.name); }}
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
                                        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                          CHAINAGE DETAILS
                                        </h5>
                                        {loadingRecords && <span className="text-[9px] font-bold text-blue-500 animate-pulse">Loading...</span>}
                                      </div>
                                      
                                      {loadingRecords ? (
                                        <div className="py-4 flex justify-center"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                                      ) : recordsError ? (
                                        <div className="text-red-500 text-[10px] font-bold py-2 text-center bg-red-50 rounded">{recordsError}</div>
                                      ) : recordsData && recordsData.length > 0 ? (
                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                          {recordsData.map((rec, rIdx) => (
                                            <div key={rIdx} className="border border-gray-100 rounded p-2 bg-gray-50/50 hover:bg-white transition-colors flex flex-col sm:flex-row gap-3">
                                              <div className="w-16 shrink-0 flex flex-col items-center justify-center bg-white rounded shadow-sm border border-gray-100 p-1">
                                                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">CH</span>
                                                <span className="text-sm font-black text-gray-800">{rec.chainage}</span>
                                              </div>
                                              
                                              <div className="flex-1 flex flex-col gap-1 justify-center">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${rec.status === 'Critical' ? 'bg-red-100 text-red-700' : rec.status === 'Observation' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                    {rec.status}
                                                  </span>
                                                  <span className="text-[9px] font-bold text-gray-400">RATING: <span className="text-gray-800">{rec.rating}/10</span></span>
                                                  <span className="text-[9px] font-bold text-gray-400">DIR: <span className="text-gray-800">{rec.direction}</span></span>
                                                </div>
                                                
                                                <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
                                                  {rec.remark && rec.remark !== '-' && rec.remark !== 'No remarks provided' ? `"${rec.remark}"` : <span className="text-gray-400 italic font-normal">No remark</span>}
                                                </p>
                                                
                                                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                                  {new Date(rec.date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                              </div>
                                              
                                              {rec.evidence && (
                                                <div className="shrink-0 w-16 h-16 bg-gray-100 rounded shadow-sm overflow-hidden border border-gray-200">
                                                  <img src={rec.evidence} alt="Evidence" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
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
'''

logic_pattern = re.compile(r'(\s*const toggleEvidenceExpand = \(index\) => \{.*?\};)', re.DOTALL)
content = logic_pattern.sub(logic_hooks, content)

# Remove assetBarData completely
assetBarData_pattern = re.compile(r'\s*const assetBarData = useMemo\(\(\) => \{.*?\},\s*\[data\]\);', re.DOTALL)
content = assetBarData_pattern.sub('', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Rewrite complete.')
