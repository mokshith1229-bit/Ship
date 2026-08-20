import React from 'react';
import { motion } from 'framer-motion';
import { MdOutlineSensors, MdOutlineDirectionsCar, MdOutlineMap, MdArrowForward } from 'react-icons/md';
import StatusBadge from './StatusBadge';
import MiniProgressRing from './MiniProgressRing';

const getRoadIcon = (name) => {
  // Return different icons based on name length just for variety
  if (name.length > 4) return <MdOutlineSensors />;
  if (name.includes('M')) return <MdOutlineDirectionsCar />;
  return <MdOutlineMap />;
};

const RoadCard = ({ data, onHoverStart, onHoverEnd, onClick }) => {
  // Parse dummy completion percentage based on name length for variety
  const completion = Math.min(100, data.roadName.length * 15 + 20);

  return (
    <motion.div
      layoutId={`card-${data.roadName}`}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => onHoverStart(data)}
      onHoverEnd={onHoverEnd}
      onClick={() => onClick(data)}
      className="group relative bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(37,99,235,0.1)] cursor-pointer transition-shadow duration-300 overflow-hidden flex flex-col h-[220px]"
    >
      {/* Subtle animated gradient border on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-transparent group-hover:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {/* Spotlight Cursor Effect Overlay (CSS only simplified version) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_800px_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.8),transparent_40%)]"></div>

      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-50 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            {getRoadIcon(data.roadName)}
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{data.roadName}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {data.roadFullName.replace('SPV Name : ', '')}
          </p>
        </div>

        {/* Hover reveal section: Progress and Footer */}
        <div className="mt-4 flex items-center justify-between opacity-70 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-3">
            <MiniProgressRing percentage={completion} />
            <div className="text-xs text-gray-500 flex flex-col">
              <span className="font-semibold text-gray-700">Updated</span>
              <span>{data.dateCreated.split(',')[0]}</span>
            </div>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <MdArrowForward className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoadCard;
