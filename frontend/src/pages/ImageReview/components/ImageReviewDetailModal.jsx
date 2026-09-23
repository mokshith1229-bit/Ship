import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import { 
  MdClose, MdImage, 
  MdKeyboardArrowLeft, MdKeyboardArrowRight, MdWbSunny, MdNightsStay,
  MdLocationOn, MdMoreHoriz, MdArrowBack, MdDirectionsCar
} from 'react-icons/md';
import { FaRoad, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const ImageReviewDetailModal = ({ batch, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Approved', 'Rejected'
  const [selectedRange, setSelectedRange] = useState(null); // e.g. { start: 0, end: 50 }
  
  const [isZoomed, setIsZoomed] = useState(false);
  const [backgroundPos, setBackgroundPos] = useState('50% 50%');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/image-review/batches/${batch._id}/tasks`);
      // Sort tasks by chainage before setting
      const fetchedTasks = res.data.data.sort((a, b) => a.chainage - b.chainage);
      setTasks(fetchedTasks);
      
      // Auto-select first task if exists
      if (fetchedTasks.length > 0) {
        setSelectedTaskId(fetchedTasks[0]._id);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch images for review');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await api.put(`/image-review/tasks/${taskId}`, { status });
      setTasks(prevTasks => prevTasks.map(t => {
        if (t._id === taskId) {
          return { ...t, status, imageApproved: status === 'READY_FOR_RATING' };
        }
        return t;
      }));
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleAction = async (status) => {
    if (!selectedTaskId) return;
    await handleUpdateStatus(selectedTaskId, status);
  };

  // Compute derived state
  const approvedCount = tasks.filter(t => t.imageApproved).length;
  const rejectedCount = tasks.filter(t => t.status === 'EXTRACTION_FAILED' || t.status === 'FAILED').length;

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Status Filter
      if (statusFilter === 'Approved' && !t.imageApproved) return false;
      if (statusFilter === 'Rejected' && !(t.status === 'EXTRACTION_FAILED' || t.status === 'FAILED')) return false;
      
      // Range Filter
      if (selectedRange) {
        if (t.chainage < selectedRange.start || t.chainage >= selectedRange.end) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, selectedRange]);

  // Compute Chainage Ranges for bottom slider
  const chainageRanges = useMemo(() => {
    if (tasks.length === 0) return [];
    const minChainage = Math.floor(Math.min(...tasks.map(t => t.chainage)));
    const maxChainage = Math.ceil(Math.max(...tasks.map(t => t.chainage)));
    
    const ranges = [];
    // Go up to maxChainage in steps of 50
    for (let i = 0; i <= maxChainage; i += 50) {
      ranges.push({ start: i, end: i + 50 });
    }
    return ranges;
  }, [tasks]);

  // Keyboard navigation and overlay arrows
  const handlePrev = useCallback(() => {
    if (filteredTasks.length === 0) return;
    const currentIndex = filteredTasks.findIndex(t => t._id === selectedTaskId);
    if (currentIndex > 0) {
      setSelectedTaskId(filteredTasks[currentIndex - 1]._id);
    }
  }, [filteredTasks, selectedTaskId]);

  const handleNext = useCallback(() => {
    if (filteredTasks.length === 0) return;
    const currentIndex = filteredTasks.findIndex(t => t._id === selectedTaskId);
    if (currentIndex < filteredTasks.length - 1) {
      setSelectedTaskId(filteredTasks[currentIndex + 1]._id);
    }
  }, [filteredTasks, selectedTaskId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // If a filter is applied and selected task is no longer in view, select the first one in view
  useEffect(() => {
    if (filteredTasks.length > 0 && !filteredTasks.find(t => t._id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0]._id);
    } else if (filteredTasks.length === 0) {
      setSelectedTaskId(null);
    }
  }, [filteredTasks, selectedTaskId]);

  const selectedTask = tasks.find(t => t._id === selectedTaskId);

  // Helper to determine status styling (returns null if pending, effectively removing it)
  const getTaskStatusStyle = (task) => {
    if (task.imageApproved) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'Approved', icon: FaThumbsUp };
    if (task.status === 'EXTRACTION_FAILED' || task.status === 'FAILED') return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'Failed', icon: FaThumbsDown };
    return null;
  };

  // Helper to infer DAY/NIGHT based on timestamp
  const getImageRequire = (task) => {
    if (!task) return 'DAY';
    if (task.metadata?.imageRequire) return task.metadata.imageRequire;
    if (task.metadata?.extractedAt && task.metadata.extractedAt !== 'Unknown Timestamp') {
      const timeParts = task.metadata.extractedAt.split(':');
      if (timeParts.length >= 2) {
        const hour = parseInt(timeParts[0], 10);
        if (!isNaN(hour)) {
          // Night time: 6 PM (18) to 6 AM (6)
          if (hour >= 18 || hour < 6) return 'NIGHT';
          return 'DAY';
        }
      }
    }
    return 'DAY';
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-gray-50 shadow-2xl w-full h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-6 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">Review Images: {batch.name}</h2>
            
            {/* Top Status Filters */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setStatusFilter('All')} 
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${statusFilter === 'All' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All {tasks.length}
              </button>
              <button 
                onClick={() => setStatusFilter('Approved')} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${statusFilter === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-green-600 hover:bg-green-50'}`}
              >
                <FaThumbsUp /> Approved {approvedCount}
              </button>
              <button 
                onClick={() => setStatusFilter('Rejected')} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${statusFilter === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-red-600 hover:bg-red-50'}`}
              >
                <FaThumbsDown /> Rejected {rejectedCount}
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0 ml-4"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden min-h-0 w-full">
          
          {/* Left Panel: Image List */}
          <div className="w-[30%] min-w-[320px] max-w-[450px] border-r border-gray-200 bg-white overflow-y-auto p-4 space-y-3 custom-scrollbar flex-shrink-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading images...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No images match current filters.</div>
            ) : (
              filteredTasks.map(task => {
                const isSelected = selectedTaskId === task._id;
                const statusStyle = getTaskStatusStyle(task);

                return (
                  <button
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    className={`w-full text-left rounded-xl p-3 flex gap-3 items-start transition-all border ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className="w-24 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {task.image?.cloudinaryUrl ? (
                        <img src={task.image.cloudinaryUrl} className="w-full h-full object-cover" alt={`Chainage ${task.chainage}`} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                          <MdImage className="text-2xl mb-1" />
                          <span className="text-[10px]">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start mb-1 h-5">
                        {statusStyle && (
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${statusStyle.color}`}>
                            <statusStyle.icon /> {statusStyle.text}
                          </div>
                        )}
                        <MdMoreHoriz className="text-gray-400 ml-auto" />
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-0.5 truncate">
                        <span className="font-semibold text-gray-800">Chainage:</span> {task.chainage}
                      </div>
                      <div className="text-xs text-gray-600 mb-0.5 truncate">
                        <span className="font-semibold text-gray-800">Params:</span> {task.parameters?.length || 0}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate mt-1">
                        {task.metadata?.extractedAt || 'Unknown Timestamp'}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Panel: Large Preview & Metadata */}
          <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-y-auto custom-scrollbar w-full min-w-0">
            {selectedTask ? (
              <div className="w-full max-w-4xl mx-auto h-full flex flex-col min-h-0">
                
                {/* Image Viewer */}
                <div 
                  className="relative w-full bg-gray-900 rounded-2xl overflow-hidden shadow-lg mb-6 group flex-1 min-h-[450px] cursor-crosshair"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={(e) => {
                    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - left) / width) * 100;
                    const y = ((e.clientY - top) / height) * 100;
                    setBackgroundPos(`${x}% ${y}%`);
                  }}
                >
                  {selectedTask.image?.cloudinaryUrl ? (
                    <>
                      <img 
                        src={selectedTask.image.cloudinaryUrl} 
                        alt={`Chainage ${selectedTask.chainage}`}
                        className={`w-full h-full object-contain transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
                      />
                      
                      {/* Zoomed Magnifier Overlay */}
                      <div 
                        className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 ${isZoomed ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                          backgroundImage: `url(${selectedTask.image.cloudinaryUrl})`,
                          backgroundPosition: backgroundPos,
                          backgroundSize: '250%',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MdImage className="text-6xl mb-4 text-gray-600" />
                      <span className="text-xl">Image not available</span>
                    </div>
                  )}

                  {/* Status Badge Top Right (only if approved/rejected) */}
                  {selectedTask.image?.cloudinaryUrl && (
                    <div className="absolute top-4 right-4 z-30 pointer-events-none">
                      {selectedTask.imageApproved ? (
                        <span className="px-4 py-1.5 bg-green-500 text-white text-sm font-bold rounded-lg shadow-md">Approved</span>
                      ) : selectedTask.status === 'EXTRACTION_FAILED' || selectedTask.status === 'FAILED' ? (
                        <span className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-lg shadow-md">Failed</span>
                      ) : null}
                    </div>
                  )}

                  {/* Left/Right Overlay Arrows */}
                  <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-30"
                    disabled={filteredTasks.findIndex(t => t._id === selectedTaskId) <= 0}
                  >
                    <MdKeyboardArrowLeft className="text-3xl" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-30"
                    disabled={filteredTasks.findIndex(t => t._id === selectedTaskId) >= filteredTasks.length - 1}
                  >
                    <MdKeyboardArrowRight className="text-3xl" />
                  </button>
                </div>

                {/* Main Metadata Row */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-4 shrink-0 w-full">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Chainage</div>
                      <div className="text-xl font-bold text-gray-900">{selectedTask.chainage}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Params</div>
                      <div className="text-xl font-bold text-gray-900">{selectedTask.parameters?.length || 0}</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="text-xs text-gray-500 font-medium mb-1">Timestamp</div>
                      <div className="text-lg font-bold text-gray-900 truncate">{selectedTask.metadata?.extractedAt || 'Unknown Timestamp'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Road Type</div>
                      <div className="text-lg font-bold text-gray-900">{selectedTask.metadata?.roadType || 'MCW'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Image Require</div>
                      <div className="text-lg font-bold text-gray-900">{getImageRequire(selectedTask)}</div>
                    </div>
                  </div>

                  {/* Secondary Metadata Row (Icons) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg"><FaRoad className="text-gray-600 text-lg"/></div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Road Type</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{selectedTask.metadata?.roadType || 'MCW'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {getImageRequire(selectedTask) === 'NIGHT' 
                          ? <MdNightsStay className="text-indigo-600 text-lg"/> 
                          : <MdWbSunny className="text-amber-500 text-lg"/>
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Image Require</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{getImageRequire(selectedTask)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg"><MdLocationOn className="text-gray-600 text-lg"/></div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Latitude</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{selectedTask.metadata?.latitude || '17.123456'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg"><MdLocationOn className="text-gray-600 text-lg"/></div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Longitude</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{selectedTask.metadata?.longitude || '78.123456'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg"><MdDirectionsCar className="text-gray-600 text-lg"/></div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Speed</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{selectedTask.metadata?.speed || '45'} km/h</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-6 shrink-0 px-2 w-full">
                  <div className="flex items-center gap-1">
                    <MdLocationOn className="text-sm" /> <span>Use <strong className="px-1 py-0.5 bg-gray-200 rounded text-gray-800">←</strong> <strong className="px-1 py-0.5 bg-gray-200 rounded text-gray-800">→</strong> arrow keys to navigate</span>
                  </div>
                  <div>Press <strong className="px-1 py-0.5 bg-gray-200 rounded text-gray-800">ESC</strong> to go back</div>
                </div>

                {/* Bottom Action Bar - 3 buttons responsive */}
                <div className="mt-auto grid grid-cols-3 gap-4 pb-2 shrink-0 w-full">
                  <button 
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm w-full"
                  >
                    <MdArrowBack className="text-lg" /> Back
                  </button>
                  <button 
                    onClick={() => handleAction('READY_FOR_RATING')}
                    className="flex items-center justify-center gap-2 py-3.5 bg-green-600 rounded-xl text-white font-bold hover:bg-green-700 transition-colors shadow-md w-full"
                  >
                    <FaThumbsUp className="text-base" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction('FAILED')}
                    className="flex items-center justify-center gap-2 py-3.5 bg-red-600 rounded-xl text-white font-bold hover:bg-red-700 transition-colors shadow-md w-full"
                  >
                    <FaThumbsDown className="text-base" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MdImage className="text-6xl mb-4 text-gray-300" />
                <span className="text-lg">Select an image to review</span>
              </div>
            )}
          </div>
        </div>

        {/* Chainage Range Slider Navigation */}
        <div className="bg-white border-t border-gray-200 p-6 px-10 shrink-0 overflow-hidden w-full">
          <div className="text-sm font-bold text-gray-800 mb-8">Chainage Range (m)</div>
          
          <div className="relative w-full h-8 flex items-center mt-2 mb-2 min-w-0">
            {/* The line */}
            <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full z-0"></div>
            
            {/* Markers */}
            <div className="absolute inset-0 flex justify-between items-center z-10 px-[1px]">
              {chainageRanges.map((range, idx) => {
                const isActive = selectedRange?.start === range.start;
                return (
                  <div key={idx} className="relative flex flex-col items-center group cursor-pointer" onClick={() => setSelectedRange(isActive ? null : range)}>
                    {/* Tick mark */}
                    <div className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${isActive ? 'bg-blue-600 border-blue-600 scale-125' : 'bg-white border-gray-400 group-hover:border-blue-400'}`}></div>
                    
                    {/* Number */}
                    <div className={`absolute -top-7 text-[10px] font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-800'}`}>
                      {range.start}
                    </div>

                    {/* Active Pill Tooltip */}
                    {isActive && (
                      <div className="absolute top-6 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md whitespace-nowrap">
                        {range.start} - {range.end} m
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Add final marker if ranges exist */}
              {chainageRanges.length > 0 && (
                <div className="relative flex flex-col items-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-300"></div>
                  <div className="absolute -top-7 text-[10px] font-semibold text-gray-400 whitespace-nowrap">
                    {chainageRanges[chainageRanges.length - 1].end}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageReviewDetailModal;
