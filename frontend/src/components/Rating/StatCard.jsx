import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MdOutlineMoreHoriz, MdInfoOutline } from 'react-icons/md';
import TrafficLane from './TrafficLane';

const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0, duration = 3.2 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let startTime;
      const durationMs = duration * 1000;
      
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durationMs, 1);
        
        // Easing function: easeOutQuart
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(easeOut * value));
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200/60 rounded-[16px] p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] flex flex-col hover:shadow-lg transition-shadow duration-300 relative overflow-hidden h-[150px]"
    >
      {/* Subtle corner gradient from reference */}
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-blue-100/40 rounded-full blur-3xl pointer-events-none z-0"></div>
      
      <div className="flex justify-between items-center z-10 relative mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass.replace('-500', '-50')} ${colorClass.replace('bg-', 'text-')}`}>
            <Icon className="w-[18px] h-[18px] opacity-85" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-gray-700 tracking-tight">{title}</span>
            <MdInfoOutline className="text-gray-400 text-[12px]" />
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <MdOutlineMoreHoriz className="text-[18px]" />
        </button>
      </div>
      
      {/* Main Value */}
      <div className="flex flex-col justify-center flex-1 z-10 relative">
        <h3 className="text-[34px] font-semibold text-gray-900 tracking-tight leading-none mb-1 font-inter">{displayValue}</h3>
      </div>

      {/* Road Graphic at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-70 z-0 pointer-events-none rounded-b-[16px] overflow-hidden">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="cardRoadGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <path d="M-5 20L105 20L105 5L-5 5Z" fill="url(#cardRoadGradient)" />
          {/* Dashed line */}
          <path d="M0 12.5L100 12.5" stroke="white" strokeWidth="1" strokeDasharray="3 3" className="opacity-60" />
        </svg>
      </div>

      {/* Animated Logos running on the road */}
      <TrafficLane count={value} delay={delay} duration={duration} />
    </motion.div>
  );
};

export default StatCard;
