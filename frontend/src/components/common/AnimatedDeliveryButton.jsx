import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCheck } from 'react-icons/lu';
import { FaTruck } from 'react-icons/fa';

const AnimatedDeliveryButton = ({ onClick, disabled, className = '', children, text = "Bulk Assignment", successText = "Assignment Completed", ...props }) => {
  const [phase, setPhase] = useState('idle'); // idle, driving, done

  // Animation sequence driven purely by time to guarantee visual continuity
  useEffect(() => {
    if (phase === 'driving') {
      const timer = setTimeout(() => {
        setPhase('done');
      }, 2500); // Matches the 2.5s truck driving animation
      return () => clearTimeout(timer);
    } else if (phase === 'done') {
      const timer = setTimeout(() => {
        setPhase('idle');
      }, 2000); // 2s success display duration
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const getColorClasses = () => {
    if (phase === 'done') {
      return 'bg-[#22c55e] text-white'; // Green
    }
    return 'bg-[#1a2332] text-white'; // Dark navy
  };

  return (
    <motion.button
      whileHover={phase === 'idle' ? { scale: 1.02 } : {}}
      whileTap={phase === 'idle' ? { scale: 0.98 } : {}}
      disabled={disabled || phase !== 'idle'}
      onClick={(e) => {
        if (disabled || phase !== 'idle') { e.preventDefault(); return; }
        setPhase('driving');
        onClick?.(e);
      }}
      className={`relative flex items-center justify-center h-[42px] min-w-[200px] px-6 rounded-full overflow-hidden transition-colors duration-300 font-bold ${getColorClasses()} ${className}`}
      {...props}
    >
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {phase === 'idle' && (
            <motion.div 
              key="idle" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-full"
            >
              <span className="text-[15px] tracking-wide">{children || text}</span>
            </motion.div>
          )}

          {/* DONE STATE */}
          {phase === 'done' && (
            <motion.div 
              key="done" 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <LuCheck className="text-[18px] stroke-[3]" />
              <span className="text-[15px] tracking-wide">{successText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DRIVING STATE */}
        <AnimatePresence>
          {phase === 'driving' && (
            <motion.div 
              key="driving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Dashed Road Line */}
              <div className="absolute bottom-[10px] left-6 right-6 h-[2px] overflow-hidden">
                <motion.div 
                  initial={{ x: 0 }}
                  animate={{ x: ["0%", "-30%", "-30%", "-60%"] }}
                  transition={{ 
                    duration: 2.5, 
                    times: [0, 0.4, 0.8, 1],
                    ease: "linear"
                  }}
                  className="w-[200%] h-full flex gap-2"
                >
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="h-full w-3 bg-white/40 rounded-full shrink-0" />
                  ))}
                </motion.div>
              </div>

              {/* Central Scene Container */}
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-full h-full">
                
                {/* The Documents Dropping (Multiple Files) */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`doc-${i}`}
                    initial={{ x: -10, y: -2, rotate: 0, opacity: 0 }}
                    animate={{ 
                      x: [-10, -45 + (i * 12)], // Spread them out
                      y: [-2, 8 - (i * 2)],     // Stack slightly vertically
                      rotate: [0, -35 + (i * 15)], // Varying rotation
                      opacity: [0, 1, 1, 0] 
                    }}
                    transition={{ 
                      duration: 0.9, 
                      delay: 1.0 + (i * 0.15), // Stagger drops (1.0, 1.15, 1.3)
                      times: [0, 0.3, 0.7, 1], // Out, wait on ground, fade
                      ease: "easeOut"
                    }}
                    className="absolute flex flex-col items-center bg-white rounded-[2px] shadow-sm p-[3px] w-4 h-5 border border-gray-100"
                    style={{ zIndex: i }} // Ensure correct stacking order
                  >
                     <div className="w-full h-[2px] bg-blue-500 mb-[2px] rounded-full" />
                     <div className="w-full h-[2px] bg-gray-300 mb-[2px] rounded-full" />
                     <div className="w-2/3 h-[2px] bg-gray-300 rounded-full self-start" />
                  </motion.div>
                ))}

                {/* Truck moving container */}
                <motion.div
                  initial={{ x: -100 }}
                  animate={{ x: [ -100, 0, 0, 150 ] }}
                  transition={{ 
                    duration: 2.5, 
                    times: [0, 0.4, 0.8, 1], // Drive in (1s), wait longer (1s), drive out (0.5s)
                    ease: "easeInOut"
                  }}
                  className="absolute flex items-center"
                >
                  {/* The Solid Truck Icon */}
                  <div className="relative z-10 text-white text-[24px] drop-shadow-md pb-[4px]">
                    <FaTruck />
                  </div>
                </motion.div>
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.button>
  );
};

export default AnimatedDeliveryButton;
