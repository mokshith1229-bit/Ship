import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdFullscreen, MdClose } from 'react-icons/md';
import leftArrowImg from '../../assets/leftarrow.PNG';
import rightArrowImg from '../../assets/rightarrow.PNG';

const CloneImageCarousel = ({ images = [], activeIndex, onIndexChange, isEditMode = false, onEscape, isLargeScreen, onToggleLargeScreen }) => {
  const currentIndex = activeIndex !== undefined ? activeIndex : Math.max(0, Math.min(1, images.length - 1));

  const nextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (onIndexChange) {
      onIndexChange(Math.min(currentIndex + 1, images.length - 1));
    }
  }, [currentIndex, images.length, onIndexChange]);

  const prevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (onIndexChange) {
      onIndexChange(Math.max(currentIndex - 1, 0));
    }
  }, [currentIndex, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscape) onEscape();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImage, prevImage, onEscape]);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="relative w-full mx-auto flex flex-col items-center justify-center mb-0 select-none overflow-hidden pb-0">
        <div className={`relative w-full flex items-center justify-center transition-all duration-300 ${isLargeScreen ? 'h-[75vh]' : 'h-[500px] sm:h-[600px] lg:h-[700px]'}`}>
          
          {/* Main Image Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center" 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Center Frame */}
            <div className="absolute w-full h-full rounded-[20px] border-[3px] border-[#5cb85c] z-40 pointer-events-none shadow-[0_8px_30px_rgba(92,184,92,0.3)] ring-4 ring-white/50"></div>

            {images.map((img, index) => {
              const distance = index - currentIndex;
              let x = '0%';
              let scale = 1;
              let zIndex = 30;
              let opacity = 1;
              let brightness = 1;

              if (distance === 0) {
                x = '0%';
                scale = 1;
                zIndex = 30;
                opacity = 1;
                brightness = 1;
              } else if (distance < 0) {
                const absDist = Math.abs(distance);
                x = `calc(-100% - ${(absDist - 1) * 100}%)`;
                scale = 1;
                zIndex = 20 - absDist;
                opacity = 0;
                brightness = 1;
              } else if (distance > 0) {
                x = `calc(100% + ${(distance - 1) * 100}%)`;
                scale = 1;
                zIndex = 20 - distance;
                opacity = 0;
                brightness = 1;
              }

              return (
                <motion.div
                  key={img + index}
                  initial={false}
                  animate={{
                    x,
                    scale,
                    zIndex,
                    opacity,
                    filter: `brightness(${brightness})`
                  }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="absolute w-full h-full bg-white rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] group"
                >
                  <div className="w-full h-full overflow-hidden rounded-[20px] relative">
                    <img 
                      src={img} 
                      alt={`Road view ${index + 1}`} 
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    
                    {/* Top Right Action Buttons for Center Image only */}
                    {distance === 0 && (
                      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleLargeScreen) onToggleLargeScreen();
                          }}
                          className="w-10 h-10 bg-white/95 text-gray-700 hover:text-[#5cb85c] rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                          title={isLargeScreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                          {isLargeScreen ? <MdClose className="text-2xl" /> : <MdFullscreen className="text-2xl" />}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {/* Navigation Buttons directly on the image area */}
            <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-50">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevImage}
                disabled={currentIndex === 0}
                className="w-14 h-24 bg-transparent border-none focus:outline-none flex items-center justify-center pointer-events-auto disabled:opacity-0 disabled:pointer-events-none transition-all"
                title="Previous Image"
              >
                <img src={leftArrowImg} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" alt="Prev Image" draggable={false} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextImage}
                disabled={currentIndex === images.length - 1}
                className="w-14 h-24 bg-transparent border-none focus:outline-none flex items-center justify-center pointer-events-auto disabled:opacity-0 disabled:pointer-events-none transition-all"
                title="Next Image"
              >
                <img src={rightArrowImg} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" alt="Next Image" draggable={false} />
              </motion.button>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default CloneImageCarousel;
