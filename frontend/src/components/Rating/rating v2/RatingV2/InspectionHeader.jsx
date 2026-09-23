import React, { useState } from 'react';
import { MdOutlineArrowBack, MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const InspectionHeader = ({ task }) => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  
  // Persist remarks by task ID so they don't bleed into other tasks
  const [taskRemarks, setTaskRemarks] = useState({});

  if (!task) return null;

  const headerRemarks = taskRemarks[task._id] || {};

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setExpandedCard(null);
  };

  const handleCardClick = (cardName) => {
    if (!isEditMode) return;
    setExpandedCard(expandedCard === cardName ? null : cardName);
  };

  const headers = [
    { key: 'project', label: 'Project', value: task.project?.name || task.project },
    { key: 'asset', label: 'Asset', value: task.assetSubType ? `${task.assetType} (${task.assetSubType})` : task.assetType },
    { key: 'direction', label: 'Direction', value: task.direction },
    { key: 'roadType', label: 'Road', value: task.roadType },
    { key: 'chainage', label: 'Chainage', value: `${task.chainage} km`, highlight: true }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          title="Go Back"
        >
          <MdOutlineArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">HiRATE V2</h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Inspection Command Center</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between ml-16 mr-4">
        {headers.map(header => (
          <HeaderItem 
            key={header.key}
            headerKey={header.key}
            label={header.label} 
            value={header.value} 
            highlight={header.highlight}
            isEditMode={isEditMode}
            isExpanded={expandedCard === header.key}
            hasRemark={headerRemarks[header.key] && headerRemarks[header.key].trim() !== ''}
            remarkValue={headerRemarks[header.key] || ''}
            onClick={() => handleCardClick(header.key)}
            onRemarkChange={(val) => setTaskRemarks(prev => ({ 
              ...prev, 
              [task._id]: { ...(prev[task._id] || {}), [header.key]: val } 
            }))}
          />
        ))}

        {/* Edit Mode Button next to the items */}
        <div className="flex items-center shrink-0">
          <button 
            onClick={toggleEditMode}
            className={`w-10 h-10 rounded-full border-2 border-dashed transition-all duration-300 shadow-sm flex items-center justify-center ${isEditMode ? 'border-[#D4AF37] text-white bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-[#5cb85c] text-[#5cb85c] hover:bg-[#5cb85c] hover:text-white bg-white/80'}`}
            title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          >
            <MdEdit className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

const HeaderItem = ({ headerKey, label, value, highlight, isEditMode, isExpanded, hasRemark, remarkValue, onClick, onRemarkChange }) => (
  <div 
    className={`flex flex-col relative transition-all duration-300 p-2 rounded ${
      isEditMode 
        ? `cursor-pointer hover:shadow-md bg-gray-50 border ${hasRemark ? 'border-red-500' : 'border-[#5cb85c]'}` 
        : `border ${hasRemark ? 'border-red-500 bg-red-50/30' : 'border-transparent'}`
    }`}
    onClick={onClick}
  >
    {isEditMode && (
      <div className={`absolute inset-0 rounded pointer-events-none transition-all duration-300 ring-2 ring-inset ${hasRemark ? 'ring-red-500' : 'ring-transparent'} ${isExpanded && isEditMode ? (hasRemark ? 'bg-red-500/5' : 'bg-[#D4AF37]/5 ring-[#D4AF37]') : ''}`}></div>
    )}
    
    <div className="relative z-10">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">{label}</span>
      <span className={`text-base font-bold ${highlight ? 'text-green-600' : 'text-gray-900'} block whitespace-nowrap`}>
        {value || '-'}
      </span>
    </div>

    <AnimatePresence>
      {isEditMode && isExpanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0, marginTop: 0 }}
          animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-full left-0 mt-2 min-w-[220px] z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1 bg-white rounded shadow-lg border border-gray-200">
            <textarea 
              autoFocus
              className={`w-full p-2 border ${hasRemark ? 'border-red-500 focus:ring-red-500/50' : 'border-[#5cb85c] focus:ring-[#5cb85c]/50'} rounded focus:ring-2 focus:outline-none resize-y min-h-[80px] text-sm text-gray-800 bg-white`}
              placeholder={`Enter remark...`}
              value={remarkValue}
              onChange={(e) => onRemarkChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onClick(); // Closes the popup
                }
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default InspectionHeader;
