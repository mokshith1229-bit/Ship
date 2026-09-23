import React, { useState, useEffect } from 'react';
import CustomDropdown from '../common/CustomDropdown';
import { resolveRemarkRating } from '../../utils/remarkRatingResolver';
import { MdClose, MdEditRoad, MdStairs, MdChevronRight } from 'react-icons/md';
import { FaRoad, FaTree, FaLeaf, FaGripLines, FaMapMarkerAlt, FaPaintRoller } from 'react-icons/fa';
import { FaBridge, FaRoadBarrier } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const getGroupIcon = (groupName) => {
  const name = groupName.toLowerCase();
  
  // Specific Structure Parameters
  if (name.includes('wearing coat')) return <FaPaintRoller size={28} />;
  if (name.includes('rigid crash barrier') || name.includes('crash barrier')) return <FaRoadBarrier size={28} />;
  if (name.includes('structures')) return <FaBridge size={28} />;
  
  // Standard Parameters
  if (name.includes('pavement marking')) return <MdEditRoad size={28} />;
  if (name.includes('pavement')) return <FaRoad size={28} />;
  if (name.includes('shoulder')) return <FaGripLines size={28} />;
  if (name.includes('kerb')) return <MdStairs size={28} />;
  if (name.includes('row')) return <FaTree size={28} />;
  if (name.includes('median')) return <FaLeaf size={28} />;
  
  return <FaMapMarkerAlt size={28} />;
};

const ParameterPanel = ({ task, params, ratings, onChange, onOpenMissing }) => {
  const [remarkMasterConfig, setRemarkMasterConfig] = useState({});
  const [customRemarkMode, setCustomRemarkMode] = useState({});
  const [activeGroup, setActiveGroup] = useState(null);
  const [selectedForSkip, setSelectedForSkip] = useState({});

  const handleToggleSelectSkip = (pId) => {
    setSelectedForSkip(prev => ({ ...prev, [pId]: !prev[pId] }));
  };

  const handleToggleGroupSkip = (groupName, e) => {
    if (e) e.stopPropagation();
    const groupParams = groupedParams[groupName] || [];
    
    // Determine if all unskipped params in this group are currently selected
    const unskippedParams = groupParams.filter(p => {
      const pId = p.parameterKey || p._id || p.masterListId;
      return !ratings[pId]?.isSkipped;
    });
    
    if (unskippedParams.length === 0) return; // All are already skipped

    const allSelected = unskippedParams.every(p => {
      const pId = p.parameterKey || p._id || p.masterListId;
      return selectedForSkip[pId];
    });

    setSelectedForSkip(prev => {
      const next = { ...prev };
      unskippedParams.forEach(p => {
        const pId = p.parameterKey || p._id || p.masterListId;
        next[pId] = !allSelected;
      });
      return next;
    });
  };

  const handleBatchSkip = () => {
    Object.keys(selectedForSkip).forEach(pId => {
      if (selectedForSkip[pId]) {
        onChange(pId, null, 'Skipped', true);
      }
    });
    setSelectedForSkip({});
  };

  // Reset to fresh view when moving to a new chainage/task
  useEffect(() => {
    setActiveGroup(null);
    setSelectedForSkip({});
  }, [task?._id]);

  useEffect(() => {
    fetch('/remarkMaster.json')
      .then(res => res.json())
      .then(data => setRemarkMasterConfig(data))
      .catch(err => console.error('Failed to load remarkMaster.json', err));
  }, []);

  const currentCategory = task?.category || 'N/A';
  const categoryRemarks = remarkMasterConfig[currentCategory] || [];
  
  // Try to load custom remarks if available
  let allCustomRemarks = [];
  try {
    allCustomRemarks = Object.values(JSON.parse(localStorage.getItem('userCustomRemarks')) || {}).flat();
  } catch (e) {}

  const currentTaskRemarks = Object.values(ratings || {}).map(r => r.remark).filter(r => r && r !== 'Other');

  const groupedParams = (params || []).reduce((acc, param) => {
    const groupName = param.group || param.assetType || currentCategory;
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(param);
    return acc;
  }, {});

  const groupNames = Object.keys(groupedParams);

  if (!task || !params || params.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
        <p className="text-lg font-medium mb-2">No standard parameters configured for this asset.</p>
        <p className="text-sm">You can still add custom questions if necessary.</p>
        <div className="mt-6">
          <button 
            onClick={onOpenMissing}
            className="px-4 py-2 bg-green-50 text-green-700 font-semibold rounded hover:bg-green-100 flex items-center gap-2 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Missing Question
          </button>
        </div>
      </div>
    );
  }

  const renderParamCard = (param) => {
    const pId = param.parameterKey || param._id || param.masterListId;
    const r = ratings[pId];
    const score = r ? r.score : null;
    const remark = r ? r.remark : '';
    const isSkipped = r ? r.isSkipped : false;

    const paramCategory = param.category || param.assetType || currentCategory;
    const paramMasterRemarks = remarkMasterConfig[paramCategory] || [];
    const combinedMasterRemarks = [...new Set([...categoryRemarks, ...paramMasterRemarks])];
    const dynamicRemarkOptions = [...new Set([...combinedMasterRemarks, ...allCustomRemarks, ...currentTaskRemarks]), 'Other'];

    return (
      <div key={pId} className="flex flex-col gap-3 pb-6 border-b border-gray-100 last:border-0 last:pb-0 relative">
        <div className="flex justify-between items-start gap-2">
          <h3 className={`text-sm font-semibold leading-snug ${isSkipped ? 'text-gray-400' : 'text-gray-800'}`}>{param.parameterName || param.parameter}</h3>
          
          {isSkipped ? (
            <button 
              onClick={() => onChange(pId, 10, '', false)} 
              className="text-[11px] font-extrabold uppercase text-white hover:text-white bg-blue-600 hover:bg-blue-700 shadow-md border border-blue-700 px-3 py-1.5 rounded-md shrink-0 transition-all pointer-events-auto"
            >
              Undo Skip
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0 bg-gray-50/80 rounded-full px-2.5 py-1 border border-gray-200 shadow-sm">
              <input 
                type="checkbox" 
                checked={!!selectedForSkip[pId]}
                onChange={() => handleToggleSelectSkip(pId)}
                className="w-3.5 h-3.5 rounded-full text-gray-600 focus:ring-gray-400 cursor-pointer"
                title="Select for batch skip"
              />
              <button 
                onClick={() => onChange(pId, null, 'Skipped', true)} 
                className="text-[11px] font-bold uppercase text-gray-500 hover:text-red-500 transition-colors"
              >
                Skip
              </button>
            </div>
          )}
        </div>

        <div className={`flex gap-2 mt-2 transition-opacity duration-300 ${isSkipped ? 'opacity-40 pointer-events-none' : ''}`}>
          <ScoreButton value={10} selectedScore={score} label="Excellent" onClick={() => onChange(pId, 10, remark, false)} />
          <ScoreButton value={5} selectedScore={score} label="Fair" onClick={() => onChange(pId, 5, remark, false)} />
          <ScoreButton value={1} selectedScore={score} label="Poor" onClick={() => onChange(pId, 1, remark, false)} />
          <ScoreButton value={0} selectedScore={score} label="Very Poor" onClick={() => onChange(pId, 0, remark, false)} />
        </div>

        <div className={`mt-2 transition-opacity duration-300 ${isSkipped ? 'opacity-40 pointer-events-none' : ''}`}>
          {customRemarkMode[pId] || (remark && !dynamicRemarkOptions.includes(remark) && remark !== 'Other' && remark !== 'Rectified' && remark !== 'Not Rectified') ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={remark === 'Other' ? '' : remark}
                onChange={(e) => onChange(pId, score, e.target.value)}
                placeholder="Enter custom remark..."
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-all placeholder-gray-400"
              />
              <button
                onClick={() => {
                  onChange(pId, score, '');
                  setCustomRemarkMode(prev => ({ ...prev, [pId]: false }));
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Cancel custom remark"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
          ) : (
              <CustomDropdown
              className={`remark-${pId} text-sm`}
              options={dynamicRemarkOptions}
              value={remark}
              onChange={(val) => {
                if (val === 'Other') {
                  setCustomRemarkMode(prev => ({ ...prev, [pId]: true }));
                  onChange(pId, '5', '', false);
                } else {
                  let newScore = score;
                  if (val && val.toLowerCase() === 'rectified') {
                    newScore = '10';
                  } else if (val && val.toLowerCase() === 'not rectified') {
                    newScore = '5';
                  } else if (val && (val.toLowerCase() === 'not applicable' || val.toLowerCase() === 'na' || val.toLowerCase() === 'n/a')) {
                    newScore = '0';
                  } else {
                    const resolvedScore = resolveRemarkRating('', val);
                    if (resolvedScore !== null) {
                      newScore = resolvedScore;
                    }
                  }
                  onChange(pId, newScore, val, false);
                }
              }}
              placeholder="Add observation/remark (optional)..."
              direction="up"
              searchable={true}
            />
          )}
        </div>
      </div>
    );
  };

  const customQuestions = Object.entries(ratings).filter(([k, r]) => r.isCustom);
  const activeParams = activeGroup ? groupedParams[activeGroup] || [] : [];
  const selectedSkipCount = Object.values(selectedForSkip).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full relative">
      <motion.div layout="position" className="shrink-0">
        <h1 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">Inspection Parameters</h1>
      </motion.div>
      
      {/* Dynamic Active Group Heading */}
      <AnimatePresence>
        {activeGroup && (
          <motion.h2 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xl font-extrabold text-gray-800 uppercase tracking-widest mb-4 shrink-0 overflow-hidden"
          >
            {activeGroup}
          </motion.h2>
        )}
      </AnimatePresence>

      {/* Parameter Navigation */}
      {groupNames.length > 0 && (
        <motion.div 
          layout
          className={`flex-none overflow-hidden ${activeGroup ? 'mb-6' : 'flex-1 flex flex-col justify-center items-center pb-12'}`}
        >
          {!activeGroup && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-500 font-medium mb-6 text-sm"
            >
              Select a parameter to begin inspection
            </motion.p>
          )}
          <motion.div 
            layout
            transition={{ layout: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }}
            className={activeGroup ? "flex flex-wrap gap-3 pb-2 px-1" : "flex flex-col gap-3 w-full max-w-[280px]"}
          >
            {groupNames.map(group => {
              const isActive = activeGroup === group;
              
              const groupParams = groupedParams[group] || [];
              const unskippedParams = groupParams.filter(p => !ratings[p.parameterKey || p._id || p.masterListId]?.isSkipped);
              const isGroupFullySelected = unskippedParams.length > 0 && unskippedParams.every(p => selectedForSkip[p.parameterKey || p._id || p.masterListId]);

              return (
                <motion.button
                  layout
                  transition={{ layout: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }}
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`relative group shadow-sm border ${
                    activeGroup 
                      ? `flex flex-col items-center justify-center p-3 rounded-xl min-w-[100px] h-[100px] ${
                          isActive
                            ? 'bg-green-50 border-green-500 ring-2 ring-green-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`
                      : 'flex items-center gap-4 p-4 rounded-2xl bg-white border-gray-200 hover:border-green-400 hover:shadow-md hover:scale-[1.02] w-full text-left'
                  }`}
                >
                  <AnimatePresence>
                     {selectedSkipCount > 0 && unskippedParams.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className={`absolute z-10 ${activeGroup ? 'top-1.5 right-1.5' : 'top-1/2 -translate-y-1/2 right-4'}`}
                        >
                          <input 
                            type="checkbox"
                            checked={isGroupFullySelected}
                            onChange={(e) => handleToggleGroupSkip(group, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded-full text-gray-600 focus:ring-gray-400 cursor-pointer shadow-sm border-gray-300"
                            title="Select all in group for skip"
                          />
                        </motion.div>
                     )}
                  </AnimatePresence>
                  <motion.div layout="position" className={`${isActive ? 'text-green-600 mb-2' : activeGroup ? 'text-gray-600 mb-2' : 'text-gray-600 bg-gray-50 p-3 rounded-xl group-hover:bg-green-50 group-hover:text-green-600 transition-colors'}`}>
                    {getGroupIcon(group)}
                  </motion.div>
                  <motion.span layout="position" className={`font-bold leading-tight ${
                    isActive ? 'text-green-700 text-xs text-center' : activeGroup ? 'text-gray-700 text-xs text-center' : 'text-gray-800 text-[15px] flex-1 group-hover:text-green-700 transition-colors'
                  }`}>
                    {group}
                  </motion.span>
                  {!activeGroup && (
                    <motion.div layout="position" className="text-gray-300 group-hover:text-green-500 transition-colors">
                      <MdChevronRight size={24} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Active Group Content (Questions) */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 origin-top"
          >
            <div className="flex flex-col gap-4">
              {activeParams.map(param => renderParamCard(param))}
            </div>

            {/* Render any added custom questions */}
            {customQuestions.length > 0 && (
              <div className="flex flex-col gap-4 mt-2 pt-4 border-t-2 border-dashed border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Custom Questions</h2>
                {customQuestions.map(([key, r]) => (
                  <div key={key} className="flex flex-col gap-3 pb-6 border-b border-gray-100 last:border-0 last:pb-0 relative">
                    <div className={`absolute top-0 right-0 text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${r.isSkipped ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-800'}`}>Custom</div>
                    
                    <div className="flex justify-between items-start gap-2 mt-4">
                      <h3 className={`text-sm font-semibold leading-snug pr-4 ${r.isSkipped ? 'text-gray-400' : 'text-gray-800'}`}>{r.parameterName}</h3>
                      
                      {r.isSkipped ? (
                        <button 
                          onClick={() => onChange(key, 10, '', false)} 
                          className="text-[11px] font-extrabold uppercase text-white hover:text-white bg-blue-600 hover:bg-blue-700 shadow-md border border-blue-700 px-3 py-1.5 rounded-md shrink-0 transition-all pointer-events-auto"
                        >
                          Undo Skip
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0 bg-gray-50/80 rounded-full px-2.5 py-1 border border-gray-200 shadow-sm">
                          <input 
                            type="checkbox" 
                            checked={!!selectedForSkip[key]}
                            onChange={() => handleToggleSelectSkip(key)}
                            className="w-3.5 h-3.5 rounded-full text-gray-600 focus:ring-gray-400 cursor-pointer"
                            title="Select for batch skip"
                          />
                          <button 
                            onClick={() => onChange(key, null, 'Skipped', true)} 
                            className="text-[11px] font-bold uppercase text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex gap-2 mt-2 transition-opacity duration-300 ${r.isSkipped ? 'opacity-40 pointer-events-none' : ''}`}>
                      <ScoreButton value={10} selectedScore={r.score} label="Excellent" onClick={() => onChange(key, 10, r.remark, false)} />
                      <ScoreButton value={5} selectedScore={r.score} label="Fair" onClick={() => onChange(key, 5, r.remark, false)} />
                      <ScoreButton value={1} selectedScore={r.score} label="Poor" onClick={() => onChange(key, 1, r.remark, false)} />
                      <ScoreButton value={0} selectedScore={r.score} label="Very Poor" onClick={() => onChange(key, 0, r.remark, false)} />
                    </div>

                    <div className={`mt-2 transition-opacity duration-300 ${r.isSkipped ? 'opacity-40 pointer-events-none' : ''}`}>
                      <input 
                        type="text" 
                        placeholder="Add observation/remark (optional)..." 
                        className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-all placeholder-gray-400"
                        value={r.remark}
                        onChange={(e) => onChange(key, r.score, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 pb-2 flex justify-center mt-auto border-t border-gray-100">
              <button 
                onClick={onOpenMissing}
                className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1 transition-colors px-4 py-2 rounded-full hover:bg-green-50"
              >
                <span className="text-lg leading-none">+</span> Add Missing Question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Batch Skip Button */}
      <AnimatePresence>
        {selectedSkipCount > 0 && activeGroup && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <button 
              onClick={handleBatchSkip}
              className="bg-gray-800 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-red-600 hover:shadow-[0_10px_20px_rgba(220,38,38,0.3)] transition-all flex items-center gap-2"
            >
              Skip Selected ({selectedSkipCount})
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScoreButton = ({ value, selectedScore, label, onClick }) => {
  const isSelected = selectedScore === value;
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-3 rounded border transition-all ${
        isSelected 
          ? 'bg-green-50 border-green-500 text-green-700 shadow-sm ring-1 ring-green-500' 
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <span className="text-xl font-bold leading-none">{value}</span>
    </button>
  );
};

export default ParameterPanel;
