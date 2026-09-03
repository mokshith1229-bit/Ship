import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ratingService } from '../../services/rating.service';
import InspectionHeader from '../../components/RatingV2/InspectionHeader';
import ImageViewer from '../../components/RatingV2/ImageViewer';
import ImageThumbnailStrip from '../../components/RatingV2/ImageThumbnailStrip';
import InspectionMap from '../../components/RatingV2/InspectionMap';
import ParameterPanel from '../../components/RatingV2/ParameterPanel';
import TaskProgress from '../../components/RatingV2/TaskProgress';
import RatingNavigation from '../../components/RatingV2/RatingNavigation';
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

  const PAGE_SIZE = 50;
  const targetPage = Math.floor(globalIndex / PAGE_SIZE) + 1;
  const localIndex = globalIndex % PAGE_SIZE;

  // Helper to normalize parameters exactly like V1
  const getParamsList = (task) => {
    if (!task) return [];
    if (task.category === 'Roadway') {
      return [...(task.ratings || []), ...(task.parameters || [])];
    }
    if (task.category === 'Structures' || task.category === 'Project Facilities' || task.category === 'ATMS') {
      return task.ratings || [];
    }
    return task.parameters || [];
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
        const pId = p.parameterKey || p._id || p.masterListId; // ratings use parameterKey/masterListId, parameters use _id
        // Only set default if we didn't already extract an existing score above
        if (!initial[pId]) {
            initial[pId] = { score: p.score ?? 10, remark: p.remark || '' }; // use p.score if it came from ratings array
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
    if (currentTask) initializeRatings(currentTask);
  }, [localIndex, currentTask]);

  const handleRatingChange = (paramKey, score, remark) => {
    if (!currentTask) return;
    setRatingsState(prev => ({
      ...prev,
      [currentTask._id]: {
        ...prev[currentTask._id],
        [paramKey]: { score, remark }
      }
    }));
  };

  const handleSaveAndNext = async () => {
    if (!currentTask || saving) return;
    setSaving(true);
    try {
      const currentRatings = ratingsState[currentTask._id] || {};
      
      // Build ratings array for API
      const paramsList = getParamsList(currentTask);
      const ratingsData = paramsList.map(p => {
        const pId = p.parameterKey || p._id || p.masterListId;
        const r = currentRatings[pId];
        return {
          masterListId: p.masterListId || p._id,
          parameterKey: p.parameterKey || p.questionId,
          parameterName: p.parameterName || p.parameter,
          group: p.group || p.assetType || currentTask.assetType, // Handle V1 group logic
          score: r ? r.score : null,
          remark: r ? r.remark : ''
        };
      });

      // Include existing dynamic/skipped ratings AND newly added custom questions
      const finalRatingsData = [...ratingsData];
      
      Object.entries(currentRatings).forEach(([key, r]) => {
         if (r.isCustom) {
           finalRatingsData.push({
             parameterKey: key,
             parameterName: r.parameterName,
             group: currentTask.assetType,
             score: r.score,
             remark: r.remark
           });
         }
      });
      
      currentTask.ratings?.forEach(existing => {
         if (!existing.masterListId && !currentRatings[existing.parameterKey]?.isCustom) {
             const key = existing.parameterKey;
             const r = currentRatings[key];
             if (r) {
                 finalRatingsData.push({ ...existing, score: r.score, remark: r.remark });
             } else {
                 finalRatingsData.push(existing);
             }
         }
      });

      await ratingService.saveTaskRatings(currentTask._id, finalRatingsData);
      
      // Move next
      if (globalIndex < totalTasks - 1) {
        const nextIndex = globalIndex + 1;
        setGlobalIndex(nextIndex);
        setSearchParams({ startIndex: nextIndex.toString() });
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

  const handleNext = () => {
    if (globalIndex < totalTasks - 1) {
      const nextIndex = globalIndex + 1;
      setGlobalIndex(nextIndex);
      setSearchParams({ startIndex: nextIndex.toString() });
    }
  };

  const handlePrevious = () => {
    if (globalIndex > 0) {
      const prevIndex = globalIndex - 1;
      setGlobalIndex(prevIndex);
      setSearchParams({ startIndex: prevIndex.toString() });
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key.toLowerCase() === 's') handleSkip();
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalIndex, totalTasks, currentTask, ratingsState, saving]);

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
        <div className="flex-1 flex flex-col gap-4 overflow-hidden relative rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex-1 relative overflow-hidden rounded-t-xl">
            <ImageViewer task={currentTask} />
            <div className="absolute bottom-4 right-4 z-10">
              <InspectionMap task={currentTask} mode="compact" />
            </div>
          </div>
          <div className="h-24 bg-white border-t border-gray-200 rounded-b-xl flex items-center justify-center">
             <ImageThumbnailStrip task={currentTask} />
          </div>
        </div>

        {/* RIGHT - Rating Panel */}
        <div className="w-[450px] flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
             <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">Inspection Parameters</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
            <ParameterPanel 
              task={currentTask} 
              params={getParamsList(currentTask)}
              ratings={ratingsState[currentTask?._id] || {}}
              onChange={handleRatingChange}
              onOpenMissing={() => setIsMissingModalOpen(true)}
            />
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
             <TaskProgress currentIndex={globalIndex} totalTasks={totalTasks} />
             <RatingNavigation 
                onPrevious={handlePrevious} 
                onNext={handleNext} 
                onSaveAndNext={handleSaveAndNext}
                onSkip={handleSkip}
                canGoPrevious={globalIndex > 0} 
                canGoNext={globalIndex < totalTasks - 1} 
                saving={saving}
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
