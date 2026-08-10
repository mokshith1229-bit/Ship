import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import logoText from '../../assets/HIRATE text.PNG';

const RollingLogo = () => {
  const repetitions = 20; 
  const itemHeight = 22; // slightly taller to match the 22px in dashboard
  const controls = useAnimation();
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerRoll = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    await controls.set({ y: 0 });
    await controls.start({ 
      y: -(repetitions - 1) * itemHeight,
      transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1] }
    });
    setIsAnimating(false);
  };

  useEffect(() => {
    triggerRoll();
  }, []);
  
  return (
    <div 
      className="relative overflow-hidden shrink-0 cursor-pointer" 
      style={{ height: `${itemHeight}px`, width: '80px' }}
      onMouseEnter={triggerRoll}
    >
      <motion.div
        className="flex flex-col w-full"
        animate={controls}
      >
        {Array.from({ length: repetitions }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center justify-start shrink-0 w-full" 
            style={{ height: `${itemHeight}px` }}
          >
            <img 
              src={logoText} 
              alt="HiRATE" 
              className="h-full w-auto object-contain" 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default RollingLogo;
