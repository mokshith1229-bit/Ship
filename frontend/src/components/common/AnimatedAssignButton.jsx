import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuSend, LuCheck } from 'react-icons/lu';

const AnimatedAssignButton = ({ onClick, disabled, className = '', ...props }) => {
  const [status, setStatus] = useState('idle');

  // Animation sequence driven purely by time to guarantee visual continuity
  useEffect(() => {
    if (status === 'sending') {
      const timer = setTimeout(() => {
        setStatus('success');
      }, 1500); // 1.5s flight duration matches rocket animation
      return () => clearTimeout(timer);
    } else if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 2000); // 2s success display duration
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Determine button colors based on the exact image spec
  const getColorClasses = () => {
    if (status === 'success') {
      return 'border-[#2e8b57] bg-[#f0fbf4] text-[#2e8b57]'; 
    }
    return 'border-black bg-white text-black';
  };

  return (
    <motion.button
      whileHover={status === 'idle' ? { scale: 1.02 } : {}}
      whileTap={status === 'idle' ? { scale: 0.98 } : {}}
      disabled={disabled || status !== 'idle'}
      onClick={(e) => {
        if (disabled || status !== 'idle') { e.preventDefault(); return; }
        setStatus('sending');
        onClick?.(e);
      }}
      className={`relative flex items-center justify-center h-[42px] min-w-[145px] px-5 rounded-full overflow-hidden border-[1.5px] transition-colors duration-500 ${getColorClasses()} ${className}`}
      {...props}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        
        {/* Text States: Idle & Success */}
        <AnimatePresence>
          {status === 'idle' && (
            <motion.div
              key="idleText"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute flex items-center justify-center gap-2"
            >
              <div className="w-[18px]" /> {/* Spacer for the absolutely positioned rocket */}
              <span className="font-bold text-[15px] whitespace-nowrap tracking-wide">Assign Work</span>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="successText"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute flex items-center justify-center gap-2"
            >
              <LuCheck className="text-[18px] stroke-[3]" />
              <span className="font-bold text-[15px] whitespace-nowrap tracking-wide">Assigned</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Flying Plane */}
        <AnimatePresence>
          {(status === 'idle' || status === 'sending') && (
            <motion.div
              key="plane"
              initial={{ x: -46, opacity: 0 }}
              animate={{ 
                x: status === 'idle' ? -46 : 150, 
                opacity: 1
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                // Delay flight slightly so rotation can happen first
                x: { duration: status === 'idle' ? 0.3 : 1.2, ease: "easeInOut", delay: status === 'idle' ? 0 : 0.2 },
                opacity: { duration: 0.3 }
              }}
              className="absolute flex items-center z-10"
            >
              {/* Motion Trail */}
              <motion.div
                initial={false}
                animate={{ 
                  width: status === 'sending' ? 60 : 0, 
                  opacity: status === 'sending' ? 1 : 0 
                }}
                transition={{ duration: 0.4, delay: status === 'sending' ? 0.3 : 0 }}
                className="absolute right-full h-[1.5px] bg-gradient-to-r from-transparent to-black"
                style={{ marginRight: '-4px' }}
              />
              
              {/* The Rocket Rotation */}
              <motion.div
                initial={false}
                animate={{ rotate: status === 'idle' ? 0 : 45 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <LuSend className="text-[18px]" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

export default AnimatedAssignButton;
