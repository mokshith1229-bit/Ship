import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileSpreadsheet, MapPin, BarChart2, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import MetricCard from './MetricCard';

const ProjectOverviewCards = ({ summary, animationState }) => {
  const prefersReducedMotion = useReducedMotion();

  // The wrapper variant handles staggering the children when revealing
  const containerVariants = {
    collapsing: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1, // collapse from right to left
      }
    },
    idle: {},
    revealing: {
      transition: {
        staggerChildren: 0.08, // 80ms stagger
        delayChildren: 0.1,    // 100ms initial delay before first card reveals
      }
    }
  };

  // If reduced motion is enabled, we use a simpler fade
  const safeAnimationState = prefersReducedMotion 
    ? (animationState === 'idle' ? 'revealing' : 'collapsing') // skip horizontal motion
    : animationState;

  return (
    <div className="w-full flex justify-start">
      <motion.div 
        className="flex flex-row w-full filter drop-shadow-sm overflow-hidden 2xl:overflow-visible"
        variants={containerVariants}
        initial="idle" // Render fully visible on mount without stagger
        animate={safeAnimationState}
      >
        <MetricCard
          index={0}
          isFirst={true}
          icon={FileSpreadsheet}
          value={summary.totalRatings}
          label="Total Ratings"
        />
        <MetricCard
          index={1}
          icon={MapPin}
          value={summary.uniqueChainages}
          label="Unique Chainages"
        />
        <MetricCard
          index={2}
          icon={BarChart2}
          value={summary.parametersRated}
          label="Parameters Rated"
        />
        <MetricCard
          index={3}
          variant="critical"
          icon={AlertTriangle}
          value={summary.criticalRatings}
          label="Critical Ratings"
        />
        <MetricCard
          index={4}
          variant="average"
          icon={TrendingUp}
          value={summary.averageRating}
          label="Average Rating"
        />
        <MetricCard
          index={5}
          isLast={true}
          icon={Calendar}
          value={summary.inspectionDateRange}
          label="Date Range"
          title={summary.inspectionDateRange}
        />
      </motion.div>
    </div>
  );
};

export default ProjectOverviewCards;
