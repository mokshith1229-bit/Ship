import React from 'react';
import { motion } from 'framer-motion';

const TaskProgress = ({ currentIndex, totalTasks }) => {
  if (totalTasks === 0) return null;

  const percentage = ((currentIndex + 1) / totalTasks) * 100;

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Task {currentIndex + 1} of {totalTasks}</span>
        <span className="text-green-600">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default TaskProgress;
