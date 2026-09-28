import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({
  icon: Icon,
  value,
  label,
  index,
  isFirst = false,
  isLast = false,
  variant = 'default',
  title = '' // used for long date ranges
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'critical':
        return {
          bg: 'bg-red-100', // Darker red body
          border: 'border-red-300', // Darker border
          dropShadow: 'drop-shadow-[0_4px_12px_rgba(239,68,68,0.2)] group-hover:drop-shadow-[0_8px_20px_rgba(239,68,68,0.3)]',
          iconBg: 'bg-red-200', // Darker circle
          iconColor: 'text-red-700',
          textColor: 'text-slate-900'
        };
      case 'average':
        return {
          bg: 'bg-green-100', // Darker green body
          border: 'border-green-300', // Darker border
          dropShadow: 'drop-shadow-[0_4px_12px_rgba(34,197,94,0.2)] group-hover:drop-shadow-[0_8px_20px_rgba(34,197,94,0.3)]',
          iconBg: 'bg-green-200', // Darker circle
          iconColor: 'text-green-800',
          textColor: 'text-slate-900'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          dropShadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.02)] group-hover:drop-shadow-[0_8px_15px_rgba(0,0,0,0.08)]',
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-600',
          textColor: 'text-slate-800'
        };
    }
  };

  const s = getStyles();

  // Z-index trick to make the chevrons overlap properly (left-to-right overlaps)
  const zIndex = 60 - index * 10;
  
  // Left margin to overlap the previous card's arrow (24px arrow depth)
  const ml = isFirst ? '' : '-ml-[24px]';
  
  // Padding logic to perfectly center text within the VISIBLE area of the chevron
  // The left notch eats 24px of the bounding box, so pl must be exactly 24px larger than pr to visually center
  let paddingLeft = 'pl-10'; // 40px
  let paddingRight = 'pr-4'; // 16px
  let flexClass = 'flex-1 min-w-[120px] lg:min-w-[140px]'; // Normal cards
  
  if (isFirst) {
    paddingLeft = 'pl-6'; // 24px
    paddingRight = 'pr-6'; // 24px
  } else if (isLast) {
    paddingLeft = 'pl-12'; // 48px
    paddingRight = 'pr-6'; // 24px
    flexClass = 'flex-[1.8] min-w-[180px] lg:min-w-[260px]'; // Give last card extra space for long date strings
  }
  
  // Border logic for the main body
  const leftBorder = isFirst ? `border-l ${s.border}` : '';
  const rightBorder = isLast ? `border-r ${s.border}` : '';
  const radius = isFirst ? 'rounded-l-xl' : isLast ? 'rounded-r-xl' : '';

  return (
    <motion.div
      variants={{
        collapsing: { x: -30, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
        idle: { x: 0, opacity: 1, transition: { duration: 0.3 } },
        revealing: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }
      }}
      className={`relative h-28 ${flexClass} ${ml} ${s.dropShadow} transition-all duration-200 ease-out hover:-translate-y-1 group`}
      style={{ zIndex }}
    >
      {/* Main Card Body (Absolute positioning so drop-shadow traces union of shapes) */}
      <div className={`absolute inset-0 ${s.bg} border-t border-b ${s.border} ${leftBorder} ${rightBorder} ${radius} transition-colors duration-200`}></div>

      {/* Chevron Arrows (Only if not last) */}
      {!isLast && (
        <>
          {/* Top Half of Arrow (Points RIGHT by skewing bottom edge to the right) */}
          <div 
            className={`absolute top-0 right-0 w-[40px] h-[50%] ${s.bg} border-t border-r ${s.border} origin-top-left transition-colors duration-200`}
            style={{ transform: 'skewX(23deg)' }}
          ></div>
          {/* Bottom Half of Arrow (Points RIGHT by skewing top edge to the right) */}
          <div 
            className={`absolute bottom-0 right-0 w-[40px] h-[50%] ${s.bg} border-b border-r ${s.border} origin-bottom-left transition-colors duration-200`}
            style={{ transform: 'skewX(-23deg)' }}
          ></div>
        </>
      )}

      {/* Content Container (z-10 to sit above backgrounds) */}
      <div className={`relative z-10 w-full h-full flex flex-col justify-center items-center ${paddingLeft} ${paddingRight}`}>
        <div className="mb-1 transition-colors duration-200">
          <div className={`${s.iconBg} p-1.5 rounded-full inline-flex items-center justify-center transition-colors duration-200`}>
            <Icon className={`w-4 h-4 ${s.iconColor} transition-colors duration-200`} />
          </div>
        </div>
        
        <div 
          className={`text-[20px] md:text-[22px] lg:text-2xl font-bold ${s.textColor} truncate leading-tight text-center w-full`} 
          title={title || (typeof value === 'string' ? value : '')}
        >
          {value}
        </div>
        
        <div className="text-xs md:text-sm font-medium text-slate-500 truncate text-center w-full">
          {label}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
