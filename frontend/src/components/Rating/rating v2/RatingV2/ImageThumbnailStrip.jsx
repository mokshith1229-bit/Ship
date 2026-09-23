import React from 'react';
import { motion } from 'framer-motion';

const ImageThumbnailStrip = ({ task, activeView, onViewChange }) => {
  if (!task || !task.image) return null;

  const getBorderClass = (viewName) => {
    return activeView === viewName 
      ? "ring-4 ring-[#22c55e] ring-offset-2 ring-offset-white opacity-100 scale-105 z-10" 
      : "border border-gray-300 opacity-80 hover:opacity-100 hover:scale-105";
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-transparent">
      <div className="relative w-full max-w-[600px] flex items-center justify-center gap-6 py-2">
        
        {/* Previous Image */}
        {task.previousImage ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`w-[25%] aspect-video bg-white rounded-lg shadow-sm cursor-pointer transition-all relative overflow-hidden shrink-0 ${getBorderClass('prev')}`}
            onClick={() => onViewChange('prev')}
          >
            <img src={task.previousImage.url} alt="Previous" className="w-full h-full object-cover" />
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono whitespace-nowrap">
              CH {task.previousImage.chainage}
            </div>
          </motion.div>
        ) : <div className="w-[25%] shrink-0" />}
        
        {/* Current Image */}
        {task.image.cloudinaryUrl && (
          <div 
            className={`w-[35%] aspect-video rounded-lg shadow-md flex flex-col items-center justify-center bg-white cursor-pointer relative overflow-hidden shrink-0 mx-2 transition-all ${getBorderClass('current')}`}
            onClick={() => onViewChange('current')}
          >
            <img src={task.image.cloudinaryUrl} alt="Current" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-[#4ade80] text-xs px-2.5 py-1 rounded font-mono font-bold shadow-sm whitespace-nowrap">
              CH {task.chainage}
            </div>
          </div>
        )}
        
        {/* Next Image */}
        {task.nextImage ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`w-[25%] aspect-video bg-white rounded-lg shadow-sm cursor-pointer transition-all relative overflow-hidden shrink-0 ${getBorderClass('next')}`}
            onClick={() => onViewChange('next')}
          >
            <img src={task.nextImage.url} alt="Next" className="w-full h-full object-cover" />
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono whitespace-nowrap">
              CH {task.nextImage.chainage}
            </div>
          </motion.div>
        ) : <div className="w-[25%] shrink-0" />}
        
      </div>
    </div>
  );
};

export default ImageThumbnailStrip;
