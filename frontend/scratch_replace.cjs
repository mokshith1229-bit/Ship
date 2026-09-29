const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Reports', 'PerformanceCenterModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update imports
const importRegex = /import \{ ([^}]+) \} from 'lucide-react';/;
content = content.replace(importRegex, (match, p1) => {
    const existingImports = p1.split(',').map(s => s.trim());
    const newIcons = ['ClipboardCheck', 'ClipboardList', 'Folder', 'Route', 'ArrowLeftRight', 'Construction', 'Gauge', 'Lightbulb', 'TriangleAlert', 'ChevronRight', 'MapPinned', 'TrendingDown', 'CircleAlert', 'Image'];
    const uniqueImports = Array.from(new Set([...existingImports, ...newIcons]));
    return `import { ${uniqueImports.join(', ')} } from 'lucide-react';`;
});

// Replace section-insights
const startMarker = '{/* ─── 11. EXECUTIVE INSIGHTS ─── */}';
const endMarker = '              </section>\n\n            </div>';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find section-insights markers");
    process.exit(1);
}

const newSection = `{/* ─── 11. EXECUTIVE INSIGHTS ─── */}
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
                          <div className="bg-emerald-500" style={{ width: \`\${data.condition.good.percentage}%\` }}></div>
                          <div className="bg-amber-400" style={{ width: \`\${data.condition.moderate.percentage}%\` }}></div>
                          <div className="bg-red-500" style={{ width: \`\${data.condition.critical.percentage}%\` }}></div>
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
                            <div className="text-2xl font-black text-slate-900 leading-tight mb-2">{topHotspot ? \`\${topHotspot.chainageRange} km\` : 'N/A'}</div>
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
                                {lowestRecord && <div className="absolute top-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white transform -translate-y-1/2 -translate-x-1/2 shadow-sm" style={{ left: \`\${(lowestRecord.score / 10) * 100}%\` }}></div>}
                              </div>
                              <div className="text-[10px] font-bold text-gray-400">10</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium space-y-1.5 mb-6">
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0"/> <span className="font-bold text-gray-700 truncate">{lowestRecord ? \`\${lowestRecord.chainage.toFixed(2)} km\` : 'N/A'}</span></div>
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
`;

content = content.substring(0, startIndex) + newSection + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated PerformanceCenterModal.jsx");
