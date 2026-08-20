import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdStar, MdStarBorder, MdArrowForward } from 'react-icons/md';
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

const HoverPopup = ({ data, anchorRect }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!anchorRect) return;

    // Calculate position. Default to right of the card.
    // If it overflows right edge, put it on the left of the card.
    const popupWidth = 360; // smaller width
    const gap = 16;
    
    let left = anchorRect.right + gap;
    let top = anchorRect.top - 20; // Slightly higher than the card

    // Check right bounds
    if (left + popupWidth > window.innerWidth - gap) {
      left = anchorRect.left - popupWidth - gap;
    }
    
    // Check bottom bounds
    const estimatedHeight = 420; // safer margin
    if (top + estimatedHeight > window.innerHeight) {
      top = window.innerHeight - estimatedHeight - gap;
    }
    // Check top bounds
    if (top < gap) top = gap;

    setPosition({ top, left });
    setIsVisible(true);
  }, [anchorRect]);

  if (!data) return null;

  // Mock some data based on the reference image
  const rating = 3.8;
  const progress = 76;
  const totalReports = 24;
  const pendingReports = 6;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ top: position.top, left: position.left }}
          className="fixed z-[60] w-[360px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden"
        >
          {/* Header section */}
          <div className="p-5 pb-3 flex gap-3 items-start border-b border-gray-100">
            {/* Star Icon Logo */}
            <div className="w-10 h-10 shrink-0 relative flex items-center justify-center">
              <img src={getSpvLogo(data.roadName)} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none mb-1">{data.roadName}</h3>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1 border border-green-100">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {data.status.replace('-', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{data.roadFullName.replace('SPV Name : ', '')}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="p-5 py-3 bg-gray-50/50">
            <div className="flex flex-col gap-2.5 text-[13px]">
              <DetailRow label="Status" value={<span className="text-green-600 font-semibold">{data.status.replace('-', ' ')}</span>} />
              <DetailRow label="Date Created" value={data.dateCreated} />
              <DetailRow label="Reported/Updated By" value={data.reportedBy} />
              <DetailRow label="Current Rating" value={
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{rating} / 5</span>
                  <div className="flex text-amber-400">
                    <MdStar /><MdStar /><MdStar /><MdStar /><MdStarBorder className="text-gray-300" />
                  </div>
                </div>
              } />
              <DetailRow label="Progress" value={
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="text-green-600 font-bold w-8">{progress}%</span>
                </div>
              } />
              <DetailRow label="Last Review Date" value="18-Aug-23" />
              <DetailRow label="Next Review Date" value="18-Nov-23" />
              <DetailRow label="Total Reports" value={totalReports} />
              <DetailRow label="Pending Reports" value={<span className="text-orange-500 font-bold">{pendingReports}</span>} />
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-white border-t border-gray-100 flex justify-center">
            <button className="flex items-center gap-2 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 px-5 py-1.5 rounded-lg transition-colors">
              Open Rating Page <MdArrowForward />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper for row formatting
const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-[130px_1fr] items-center">
    <span className="text-gray-500 flex items-center gap-1.5">
      <span className="w-4 flex justify-center text-gray-400">❖</span> {label}
    </span>
    <div className="text-gray-900 font-medium pl-3 border-l border-gray-200">{value}</div>
  </div>
);

export default HoverPopup;
