import React, { useState, useEffect, useRef } from 'react';
import ProjectOverviewCards from './ProjectOverviewCards';

const ProjectOverview = ({ summary, loadingSummary, selectedCycle }) => {
  const [animationState, setAnimationState] = useState('idle');
  const [displaySummary, setDisplaySummary] = useState(summary);
  const previousCycleRef = useRef(selectedCycle);
  const revealTimeoutRef = useRef(null);

  // Synchronize state changes when selectedCycle or loadingSummary changes
  useEffect(() => {
    // 1. Cycle Changed: Trigger Collapse
    if (selectedCycle !== previousCycleRef.current) {
      previousCycleRef.current = selectedCycle;
      setAnimationState('collapsing');
      // Do not update displaySummary yet; keep showing old data while collapsing
    } 
    // 2. Data Arrived (After Collapse): Trigger Reveal
    else if (animationState === 'collapsing' && !loadingSummary && summary) {
      // Small delay to ensure the collapse animation visually finishes (at least partially) 
      // before immediately exploding outward, making the transition feel smoother.
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        setDisplaySummary(summary); // swap data
        setAnimationState('revealing');
      }, 250); // wait ~250ms for collapse to finish
    }
    // 3. Fallback: If not animating but data changes (e.g. initial load), just sync it
    else if (animationState === 'idle' && summary && !loadingSummary) {
      setDisplaySummary(summary);
    }
  }, [selectedCycle, loadingSummary, summary, animationState]);

  // 4. Return to Idle: Wait for reveal animation to finish before allowing normal hover states
  useEffect(() => {
    if (animationState === 'revealing') {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        setAnimationState('idle');
      }, 800); // 100ms delay + (6 cards * 80ms stagger) + 300ms duration = ~800ms
    }
    return () => clearTimeout(revealTimeoutRef.current);
  }, [animationState]);

  if (!displaySummary) return null;

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold text-gray-800">Project Overview</h2>
      
      {/* We pass the animation state and the display summary (which holds stale data during collapse) */}
      <ProjectOverviewCards 
        summary={displaySummary} 
        animationState={animationState} 
      />
    </div>
  );
};

export default ProjectOverview;
