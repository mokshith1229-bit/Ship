import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import editedLogo from '../../assets/editedlogo.PNG';

const spvLogos = import.meta.glob('../../assets/spv names/*.png', { eager: true });

const getSpvLogo = (roadName) => {
  const name = roadName ? roadName.toLowerCase() : '';
  const key = `../../assets/spv names/${name}-1.png`;
  if (spvLogos[key]) {
    return spvLogos[key].default;
  }
  return editedLogo;
};

// Helper to determine left border color based on status
const getStatusColor = (status) => {
  switch (status) {
    case 'ON-GOING': return 'border-l-[#5cb85c]'; // match the green in the image
    case 'HO-PROCESS': return 'border-l-purple-600';
    case 'HO-RATED': return 'border-l-orange-500';
    case 'SPV-RATED': return 'border-l-blue-600';
    default: return 'border-l-gray-400';
  }
};

const CompactRoadCard = ({ data, onHover, onLeave, onClick }) => {
  const cardRef = useRef(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onHover(data, rect);
    }
  };

  const logoSrc = getSpvLogo(data.roadName);

  return (
    <motion.button
      ref={cardRef}
      layoutId={`card-${data.roadName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      onClick={() => onClick(data)}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative w-full h-[60px] bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-center overflow-hidden cursor-pointer group border-l-[8px] ${getStatusColor(data.status)}`}
    >
      {/* Left Logo Area */}
      <div className="w-[70px] h-full flex items-center justify-center shrink-0 z-10">
        <img src={logoSrc} alt={`${data.roadName} Logo`} className="w-[44px] h-[44px] object-contain transform group-hover:scale-110 transition-transform duration-300" />
      </div>

      {/* Center Text Wrapper */}
      <div className="flex-1 flex justify-center items-center z-10 relative h-full overflow-hidden px-4">
        {/* Large Acronym */}
        <span className="absolute text-[#1e293b] font-bold italic text-[20px] tracking-wide leading-none transition-all duration-300 transform group-hover:-translate-y-4 group-hover:opacity-0 group-hover:blur-sm">
          {data.roadName}
        </span>
        {/* Full Name on Hover */}
        <span className="absolute px-2 text-[#1e293b] font-semibold text-[10px] sm:text-[11px] leading-tight tracking-tight text-center transition-all duration-300 transform translate-y-4 opacity-0 blur-sm group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none">
          {data.roadFullName.replace('SPV Name : ', '')}
        </span>
      </div>
      
      {/* Light glow overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none z-20"></div>
    </motion.button>
  );
};

export default CompactRoadCard;

