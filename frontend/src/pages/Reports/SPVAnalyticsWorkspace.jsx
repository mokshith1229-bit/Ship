import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDownload, MdDateRange, MdFilterList } from 'react-icons/md';
import KPICard from './KPICard';
import OverviewTab from './tabs/OverviewTab';
import ProjectsTab from './tabs/ProjectsTab';
import CategoryTab from './tabs/CategoryTab';
import RatingsTab from './tabs/RatingsTab';
import TimelineTab from './tabs/TimelineTab';
import ActivityLogTab from './tabs/ActivityLogTab';

// Eager load all logos
const logos = import.meta.glob('../../assets/logos1/*.png', { eager: true, query: '?url', import: 'default' });

const getSpvLogo = (name) => {
  if (!name) return null;
  let normalized = name.toLowerCase();
  
  // Handle DB code to filename discrepancies
  if (normalized === 'datl') normalized = 'datrl';
  else if (normalized === 'jmtpl') normalized = 'jmtl';
  else if (normalized === 'ketpl') normalized = 'ketl';
  else if (normalized === 'kmtpl') normalized = 'kmtl';
  else if (normalized === 'mktpl') normalized = 'mktl';
  else if (normalized === 'smtpl') normalized = 'smtl';
  else if (normalized === 'nam') normalized = 'namel';
  else if (normalized === 'wmptl') normalized = 'wmp';

  const key = `../../assets/logos1/${normalized}-1.png`;
  return logos[key] || null;
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'ratings', label: 'Ratings Analysis' },
  { id: 'category', label: 'Category Performance' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'activity', label: 'Activity Log' }
];

const CountUp = ({ to, delay = 0 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const duration = 1500;
    let animationFrame;
    
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * to));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);
    
    return () => {
      clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [to, delay]);

  return <>{count.toLocaleString()}</>;
};

const AnimatedCircle = ({ percentage, color, delay = 0 }) => {
  const dashArray = 214;
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  
  return (
    <svg className="w-full h-full transform -rotate-90">
      <circle cx="40" cy="40" r="34" fill="none" stroke={`${color}33`} strokeWidth="6" />
      <motion.circle 
        cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6" 
        strokeDasharray={dashArray} 
        strokeLinecap="round" 
        initial={{ strokeDashoffset: dashArray }}
        animate={{ strokeDashoffset: [dashArray, 0, dashOffset] }}
        transition={{ duration: 2, ease: "easeInOut", delay }}
      />
    </svg>
  );
};

const SPVAnalyticsWorkspace = ({ baseSpv, data, loading }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('7 Aug');
  
  if (!baseSpv) return null;

  const spv = data?.spv || baseSpv;
  const kpi = data?.kpi;
  const ratingAnalytics = data?.ratingAnalytics;
  const categoryPerformance = data?.categoryPerformance;
  const projects = data?.projects;
  const logoUrl = getSpvLogo(baseSpv.name);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Top Controls / Filters */}
      <div className="absolute top-4 right-6 z-50 flex items-end gap-4">
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-[#1e3a8a] mb-1.5">Version:</span>
          <div className="relative">
            <button 
              onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)} 
              className="flex items-center justify-between gap-6 px-4 py-2 border-2 border-green-500 rounded-lg text-sm font-bold text-[#1e3a8a] bg-white shadow-sm hover:bg-green-50 transition-colors min-w-[110px]"
            >
              {selectedVersion}
              <svg className={`w-4 h-4 text-green-600 font-bold transition-transform ${isVersionDropdownOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            </button>

            {isVersionDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-100 rounded-lg shadow-xl py-2 w-full min-w-[130px] z-50">
                {['7 Aug', '1 Aug'].map(version => (
                  <button
                    key={version}
                    onClick={() => {
                      setSelectedVersion(version);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition-colors ${
                      selectedVersion === version 
                        ? 'bg-[#16A34A] text-yellow-300 hover:bg-green-700' 
                        : 'text-[#1e3a8a] hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    {version}
                    {selectedVersion === version && (
                      <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="flex items-center gap-2 px-5 py-2 bg-[#16A34A] text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition-colors mb-[1px]">
          <MdDownload className="text-base" /> Export
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* TITLE CARD */}
        <motion.div 
          layoutId={`spv-card-${baseSpv._id}`}
          className="p-6 m-6 mb-4 bg-green-50/50 rounded-2xl border border-green-100/60 shadow-sm flex items-center z-20 relative overflow-hidden"
        >
          <div className="flex items-center gap-6 relative z-10">
            <motion.div layoutId={`spv-logo-container-${baseSpv._id}`} className="w-28 h-28 rounded-xl bg-white border border-green-100/50 shadow-sm flex items-center justify-center p-3 shrink-0">
              {logoUrl ? (
                <motion.img layoutId={`spv-logo-img-${baseSpv._id}`} src={logoUrl} alt={baseSpv.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <motion.span layoutId={`spv-logo-text-${baseSpv._id}`} className="text-3xl font-black text-green-600">{baseSpv.name?.substring(0,4)}</motion.span>
              )}
            </motion.div>
            
            <motion.div layoutId={`spv-info-${baseSpv._id}`}>
              <div className="flex items-center gap-4 mb-2">
                <motion.h1 layoutId={`spv-name-${baseSpv._id}`} className="text-4xl font-black text-gray-900 tracking-tight">{baseSpv.name}</motion.h1>
                {spv.isActive && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    Active
                  </motion.span>
                )}
              </div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-base font-medium"
              >
                {spv.fullName || `${baseSpv.name} SPV`}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        {/* TOP DASHBOARD SECTION - Delayed until data loads */}
        <AnimatePresence>
          {!loading && data && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-6 mb-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr_1.5fr] gap-6"
            >
          
          {/* CARD 1: PROJECT SCHEDULE */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0A3B31] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between border border-[#0A3B31]"
          >
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            
            <h2 className="text-xs font-black tracking-widest text-white/90 uppercase mb-8">Project Schedule</h2>
            
            <div className="relative pl-7 mt-2 mb-2">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-white/20"></div>
              
              <div className="mb-8 relative">
                <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <MdDateRange className="text-green-600 text-xs" />
                </div>
                <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1.5 leading-none mt-1">Starting Date</p>
                <p className="text-2xl font-black tracking-tight">{spv.createdAt ? formatDate(spv.createdAt) : '23 Jul 2026'}</p>
                <p className="text-xs text-white/60 font-medium mt-0.5">{spv.createdAt ? new Date(spv.createdAt).toLocaleDateString('en-US', { weekday: 'long' }) : 'Thursday'}</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <MdDateRange className="text-green-600 text-xs" />
                </div>
                <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1.5 leading-none mt-1">Ending Date</p>
                <p className="text-2xl font-black tracking-tight">{spv.status === 'COMPLETED' ? formatDate(spv.endDate) : 'Present'}</p>
                <p className="text-xs text-white/60 font-medium mt-0.5">{spv.status === 'COMPLETED' && spv.endDate ? new Date(spv.endDate).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: PROJECT TIMELINE */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-10">
              <h2 className="text-xs font-black tracking-widest text-gray-800 uppercase">Project Timeline</h2>
              <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-green-700 bg-green-50 border border-green-100 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {spv.status === 'COMPLETED' ? 'Project Completed' : 'Project Ongoing'}
              </span>
            </div>
            
            <div className="relative mt-auto mb-6">
              <div className="absolute top-1.5 w-full h-2.5 bg-gray-100 rounded-full"></div>
              <div className={`absolute top-1.5 left-0 h-2.5 bg-green-500 rounded-full ${spv.status === 'COMPLETED' ? 'w-full' : 'w-[60%]'}`}></div>
              
              <div className="absolute -top-0.5 left-0 w-6 h-6 bg-green-500 rounded-full border-[3px] border-white shadow-sm"></div>
              <div className={`absolute -top-0.5 -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full border-[3px] border-white shadow-sm ${spv.status === 'COMPLETED' ? 'left-[100%]' : 'left-[60%]'}`}></div>
              
              <div className="flex justify-between mt-8">
                <div>
                  <p className="text-lg font-black text-gray-900">{spv.createdAt ? formatDate(spv.createdAt) : '23 Jul 2026'}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-1">Project Started</p>
                </div>
                <div className={`text-center ${spv.status === 'COMPLETED' ? '' : 'translate-x-10'}`}>
                  <p className="text-lg font-black text-gray-900">{spv.status === 'COMPLETED' && spv.endDate ? formatDate(spv.endDate) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-1">{spv.status === 'COMPLETED' ? 'Project Completed' : 'Today'}</p>
                </div>
                <div></div>
              </div>
            </div>
          </motion.div>

          {/* CARD 3: RATING PERFORMANCE */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col"
          >
            <h2 className="text-xs font-black tracking-widest text-gray-800 uppercase mb-8">Rating Performance</h2>
            
            <div className="flex divide-x divide-gray-100 h-full">
              <div className="flex-1 pr-4 flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-6">1 Ratings Timeline</p>
                <div className="relative w-20 h-20 mb-5">
                  <AnimatedCircle percentage={kpi?.imagesRated ? Math.round(((ratingAnalytics?.ratings1 || 0) / kpi.imagesRated) * 100) : 0} color="#ef4444" delay={0.8} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-black text-red-600">
                      <CountUp to={kpi?.imagesRated ? Math.round(((ratingAnalytics?.ratings1 || 0) / kpi.imagesRated) * 100) : 0} delay={1.8} />%
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900"><CountUp to={ratingAnalytics?.ratings1 || 0} delay={1.2} /></p>
                <p className="text-xs font-semibold text-gray-500 mt-1">of {(kpi?.imagesRated || 0).toLocaleString()} images</p>
              </div>

              <div className="flex-1 pl-4 flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-6">5 Ratings Timeline</p>
                <div className="relative w-20 h-20 mb-5">
                  <AnimatedCircle percentage={kpi?.imagesRated ? Math.round(((ratingAnalytics?.ratings5 || 0) / kpi.imagesRated) * 100) : 0} color="#22c55e" delay={0.9} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-black text-green-600">
                      <CountUp to={kpi?.imagesRated ? Math.round(((ratingAnalytics?.ratings5 || 0) / kpi.imagesRated) * 100) : 0} delay={1.9} />%
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900"><CountUp to={ratingAnalytics?.ratings5 || 0} delay={1.3} /></p>
                <p className="text-xs font-semibold text-gray-500 mt-1">of {(kpi?.imagesRated || 0).toLocaleString()} images</p>
              </div>
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* CONTRIBUTOR SUMMARY - Delayed until data loads */}
        <AnimatePresence>
          {!loading && data && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-6 mb-12"
            >
          
          <div className="flex items-end justify-between mb-5 px-1">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 border border-green-100/50 shadow-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Contributor Summary</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Overview of users and their rating activity</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-colors">
                <MdDownload className="text-gray-400 text-[15px]" /> Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg text-xs font-bold text-green-700 bg-green-50 shadow-sm hover:bg-green-100 transition-colors">
                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                View All
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f3fbf6] border-b border-gray-100">
                <tr>
                  <th className="py-4 px-8 text-[11px] font-black text-green-800 uppercase tracking-widest w-[70%]">
                    User Name
                  </th>
                  <th className="py-4 px-8 text-[11px] font-black text-green-800 uppercase tracking-widest text-right w-[30%]">
                    Images Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.contributors && data.contributors.length > 0 ? (
                  data.contributors.map((c, i) => (
                    <tr key={c._id || i} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-8 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-[#0A3B31] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                          {c.userName ? c.userName.substring(0,2).toUpperCase() : 'U'}
                        </div>
                        <span className="font-bold text-gray-900">{c.userName || 'Unknown User'}</span>
                      </td>
                      <td className="py-4 px-8 text-right font-black text-green-600 text-lg">
                        {c.imagesCount ? c.imagesCount.toLocaleString() : 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-gray-400 font-medium">No contributors found for this SPV.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SPVAnalyticsWorkspace;
