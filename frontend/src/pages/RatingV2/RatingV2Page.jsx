import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ratingService } from '../../services/rating.service';
import InspectionHeader from '../../components/RatingV2/InspectionHeader';
import ImageViewer from '../../components/RatingV2/ImageViewer';
import ImageThumbnailStrip from '../../components/RatingV2/ImageThumbnailStrip';
import ParameterPanel from '../../components/RatingV2/ParameterPanel';
import AddMissingQuestion from '../../components/RatingV2/AddMissingQuestion';

const RatingV2Page = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startIndex = parseInt(searchParams.get('startIndex'), 10) || 0;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [globalIndex, setGlobalIndex] = useState(startIndex);
  const [loadedPage, setLoadedPage] = useState(null);
  const [ratingsState, setRatingsState] = useState({});
  const [saving, setSaving] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [activeImageView, setActiveImageView] = useState('current'); // 'prev', 'current', 'next'

  const PAGE_SIZE = 50;
  const targetPage = Math.floor(globalIndex / PAGE_SIZE) + 1;
  const localIndex = globalIndex % PAGE_SIZE;

  // Helper to normalize parameters exactly like V1 without duplicates
  const getParamsList = (task) => {
    if (!task) return [];
    let combined = [];
    if (task.category === 'Roadway') {
      combined = [...(task.parameters || []), ...(task.ratings || [])];
    } else if (task.category === 'Structures' || task.category === 'Project Facilities' || task.category === 'ATMS') {
      combined = task.ratings || [];
    } else {
      combined = task.parameters || [];
    }
    
    const unique = [];
    const seen = new Set();
    combined.forEach(p => {
      const key = p.parameterKey || p._id || p.masterListId;
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push({
            ...p,
            parameterKey: key,
            parameterName: p.parameterName || p.parameter,
            group: p.group || p.assetType || task.assetType
        });
      }
    });
    return unique;
  };

  // Initialize rating state for a task if not already present
  const initializeRatings = (task) => {
    if (!task) return;
    setRatingsState(prev => {
      if (prev[task._id]) return prev;
      
      const initial = {};
      const paramsList = getParamsList(task);
      
      // If task already has existing ratings saved in the DB, merge them
      if (task.ratings && task.ratings.length > 0 && task.category !== 'Structures' && task.category !== 'Project Facilities' && task.category !== 'ATMS') {
        task.ratings.forEach(r => {
          const key = r.masterListId || r.parameterKey;
          initial[key] = { score: r.score, remark: r.remark || '' };
        });
      }
      
      // Map all standard parameters (either from parameters or pre-populated ratings)
      paramsList.forEach(p => {
        const pId = p.parameterKey || p._id || p.masterListId;
        if (!initial[pId]) {
            initial[pId] = { score: p.score ?? 10, remark: p.remark || '' }; 
        }
      });

      return { ...prev, [task._id]: initial };
    });
  };

  useEffect(() => {
    setGlobalIndex((prev) => prev !== startIndex ? startIndex : prev);
  }, [startIndex]);

  useEffect(() => {
    setLoadedPage(null); // Force reload ONLY if batchId changes
  }, [batchId]);

  const fetchTasksForPage = async (page, signal) => {
    try {
      setLoading(true);
      const res = await ratingService.getBatchTasks(batchId, { page, limit: PAGE_SIZE });
      if (signal && signal.aborted) return;
      
      const paginatedData = res?.data || res;
      const fetchedTasks = paginatedData?.tasks || [];
      const total = paginatedData?.total || 0;

      setTasks(fetchedTasks);
      setTotalTasks(total);
      setLoadedPage(page);

      fetchedTasks.forEach(t => {
        initializeRatings(t);
      });
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('Failed to load tasks:', err);
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (loadedPage !== targetPage && batchId) {
      const controller = new AbortController();
      fetchTasksForPage(targetPage, controller.signal);
      return () => controller.abort();
    }
  }, [targetPage, loadedPage, batchId]);

  const currentTask = tasks[localIndex] || null;

  useEffect(() => {
    if (currentTask) {
      initializeRatings(currentTask);
      setActiveImageView('current');
    }
  }, [localIndex, currentTask]);

  const handleRatingChange = (paramKey, score, remark, isSkipped = false) => {
    if (!currentTask) return;
    setRatingsState(prev => {
      const currentTaskRatings = prev[currentTask._id] || {};
      const currentParamRating = currentTaskRatings[paramKey] || {};
      
      return {
        ...prev,
        [currentTask._id]: {
          ...currentTaskRatings,
          [paramKey]: { 
            score, 
            remark,
            isCustom: currentParamRating.isCustom,
            parameterName: currentParamRating.parameterName,
            isSkipped 
          }
        }
      };
    });
  };

  const handleSaveAndNavigate = async (direction) => {
    if (!currentTask || saving) return;
    setSaving(true);
    try {
      const currentRatings = ratingsState[currentTask._id] || {};
      
      const finalRatingsMap = new Map();

      // 1. Add standard parameters
      (currentTask.parameters || []).forEach(p => {
        const key = p._id || p.parameterKey;
        const r = currentRatings[key];
        finalRatingsMap.set(key, {
          masterListId: p._id || p.masterListId,
          parameterKey: key,
          parameterName: p.parameter || p.parameterName,
          group: p.group || p.assetType || currentTask.assetType,
          score: r ? (r.isSkipped ? null : r.score) : null,
          remark: r ? (r.isSkipped ? 'Skipped' : r.remark) : '',
          isSkipped: r ? r.isSkipped : false
        });
      });

      // 2. Add existing DB ratings (overrides standard ones with same key)
      (currentTask.ratings || []).forEach(p => {
        const key = p.parameterKey;
        const r = currentRatings[key];
        if (finalRatingsMap.has(key)) {
            const existing = finalRatingsMap.get(key);
            existing.score = r ? (r.isSkipped ? null : r.score) : existing.score;
            existing.remark = r ? (r.isSkipped ? 'Skipped' : r.remark) : existing.remark;
            existing.isSkipped = r ? r.isSkipped : false;
        } else {
            finalRatingsMap.set(key, {
              masterListId: p.masterListId,
              parameterKey: key,
              parameterName: p.parameterName,
              group: p.group || currentTask.assetType,
              score: r ? (r.isSkipped ? null : r.score) : p.score,
              remark: r ? (r.isSkipped ? 'Skipped' : r.remark) : p.remark,
              isSkipped: r ? r.isSkipped : false
            });
        }
      });

      // 3. Add any newly added custom questions
      Object.entries(currentRatings).forEach(([key, r]) => {
         if (r.isCustom && !finalRatingsMap.has(key)) {
           finalRatingsMap.set(key, {
             parameterKey: key,
             parameterName: r.parameterName,
             group: currentTask.assetType,
             score: r.isSkipped ? null : r.score,
             remark: r.isSkipped ? 'Skipped' : r.remark,
             isSkipped: r.isSkipped
           });
         }
      });

      const finalRatingsData = Array.from(finalRatingsMap.values());

      await ratingService.saveTaskRatings(currentTask._id, finalRatingsData);
      
      if (direction === 'next' && globalIndex < totalTasks - 1) {
        const nextIndex = globalIndex + 1;
        setGlobalIndex(nextIndex);
        setSearchParams({ startIndex: nextIndex.toString() });
      } else if (direction === 'prev' && globalIndex > 0) {
        const prevIndex = globalIndex - 1;
        setGlobalIndex(prevIndex);
        setSearchParams({ startIndex: prevIndex.toString() });
      }
    } catch (err) {
      console.error('Failed to save task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!currentTask || saving) return;
    setSaving(true);
    try {
      await ratingService.skipTask(currentTask._id, {
        reason: 'Skipped in V2',
        remarks: 'Inspector skipped task via command center'
      });
      if (globalIndex < totalTasks - 1) {
        const nextIndex = globalIndex + 1;
        setGlobalIndex(nextIndex);
        setSearchParams({ startIndex: nextIndex.toString() });
      }
    } catch (err) {
      console.error('Failed to skip task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleShiftImageRight = () => {
    if (activeImageView === 'prev') setActiveImageView('current');
    else if (activeImageView === 'current' && currentTask?.nextImage) setActiveImageView('next');
  };

  const handleShiftImageLeft = () => {
    if (activeImageView === 'next') setActiveImageView('current');
    else if (activeImageView === 'current' && currentTask?.previousImage) setActiveImageView('prev');
  };

  // Keyboard Shortcuts - ONLY Image Shifting (No Save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') handleShiftImageRight();
      if (e.key === 'ArrowLeft') handleShiftImageLeft();
      if (e.key.toLowerCase() === 's') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalIndex, totalTasks, currentTask, ratingsState, saving, activeImageView]);

  if (loading && tasks.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-white text-gray-800">Loading Inspection Data...</div>;
  }

  if (tasks.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-white text-gray-800">No tasks available for rating.</div>;
  }

  const handleAddMissingQuestion = (questionData) => {
    if (!currentTask) return;
    setRatingsState(prev => ({
      ...prev,
      [currentTask._id]: {
        ...prev[currentTask._id],
        [questionData.parameterKey]: { 
          score: questionData.score, 
          remark: questionData.remark,
          isCustom: true,
          parameterName: questionData.parameterName 
        }
      }
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans overflow-hidden selection:bg-green-100 selection:text-green-900">
      <InspectionHeader task={currentTask} />
      
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* LEFT / MAIN - Image & Map */}
        <div className="h-full flex flex-col items-center justify-start gap-4 shrink-0 max-w-[68%] min-w-[50%]">
          <div className="w-fit h-auto max-h-[calc(100%-110px)] relative overflow-hidden rounded-xl shadow-md border border-gray-300 flex items-center justify-center bg-gray-50">
            <ImageViewer 
              task={currentTask} 
              activeView={activeImageView}
              onNext={() => handleSaveAndNavigate('next')}
              onPrevious={() => handleSaveAndNavigate('prev')}
              hasNext={globalIndex < totalTasks - 1}
              hasPrevious={globalIndex > 0}
            />
          </div>
          <div className="h-auto py-2 w-full bg-white border border-gray-200 rounded-xl flex items-center justify-center relative shadow-sm shrink-0">
             <ImageThumbnailStrip 
               task={currentTask} 
               activeView={activeImageView}
               onViewChange={setActiveImageView} 
             />
          </div>
        </div>

        {/* RIGHT - Rating Panel */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex-1 p-4 pb-0 flex flex-col overflow-hidden">
            <ParameterPanel 
              task={currentTask} 
              params={getParamsList(currentTask)}
              ratings={ratingsState[currentTask?._id] || {}}
              onChange={handleRatingChange}
              onOpenMissing={() => setIsMissingModalOpen(true)}
            />
          </div>
        </div>
      </div>
      <AddMissingQuestion 
        isOpen={isMissingModalOpen} 
        onClose={() => setIsMissingModalOpen(false)} 
        onAdd={handleAddMissingQuestion} 
      />
    </div>
  );
};

export default RatingV2Page;
