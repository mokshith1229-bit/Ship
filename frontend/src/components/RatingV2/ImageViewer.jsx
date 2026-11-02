import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MdFullscreen, MdClose, MdZoomIn, MdZoomOut, MdRotateRight, MdRotateLeft } from 'react-icons/md';
import LeftArrowImg from '../../assets/left_arrow_btn.png';
import RightArrowImg from '../../assets/right_arrow_btn.png';

const ImageViewer = ({ task, activeView = 'current', onNext, onPrevious, hasNext, hasPrevious }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoomState, setZoomState] = useState({ show: false, x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFullScreen && e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  if (!task) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
        Loading inspection data...
      </div>
    );
  }

  const getDisplayData = () => {
    if (activeView === 'prev') {
      if (task.previousImage && task.previousImage.url) {
        return { url: task.previousImage.url, chainage: task.previousImage.chainage, label: 'Previous' };
      }
      return { url: null, chainage: (parseFloat(task.chainage) - 0.010).toFixed(3), label: 'Previous' };
    }
    if (activeView === 'next') {
      if (task.nextImage && task.nextImage.url) {
        return { url: task.nextImage.url, chainage: task.nextImage.chainage, label: 'Next' };
      }
      return { url: null, chainage: (parseFloat(task.chainage) + 0.010).toFixed(3), label: 'Next' };
    }
    if (task.image && task.image.cloudinaryUrl) {
      return { url: task.image.cloudinaryUrl, chainage: task.chainage, label: 'Centre' };
    }
    return { url: null, chainage: task.chainage, label: 'Centre' };
  };

  const displayData = getDisplayData();
  const { latitude, longitude, speed } = task.metadata || {};

  return (
    <>
      <div className="w-full h-full relative bg-transparent overflow-hidden group">
        <div 
          className="w-full h-full flex items-center justify-center relative cursor-crosshair"
          onMouseEnter={() => { if (displayData.url) setZoomState(prev => ({ ...prev, show: true })); }}
          onMouseLeave={() => setZoomState(prev => ({ ...prev, show: false }))}
          onMouseMove={(e) => {
            if (!displayData.url) return;
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            setZoomState({ 
              show: true, 
              x: Math.max(0, Math.min(1, x)), 
              y: Math.max(0, Math.min(1, y))
            });
          }}
          onClick={() => {
            if (displayData.url) {
              setIsFullScreen(true);
              setRotation(0);
            }
          }}
        >
          <AnimatePresence mode="wait">
            {displayData.url ? (
              <motion.img
                key={`${task._id}-${activeView}`}
                src={displayData.url}
                alt={`Chainage ${displayData.chainage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-full object-contain rounded-xl"
                style={
                  zoomState.show
                    ? {
                        transform: 'scale(3.5)',
                        transformOrigin: `${zoomState.x * 100}% ${zoomState.y * 100}%`,
                        transition: 'transform 0.1s ease-out'
                      }
                    : {
                        transform: 'scale(1)',
                        transformOrigin: 'center center',
                        transition: 'transform 0.3s ease-out'
                      }
                }
              />
            ) : (
              <motion.div
                key={`${task._id}-${activeView}-empty`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-8 text-center text-gray-400 select-none"
              >
                <div className="w-16 h-16 mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {displayData.label} Image Unavailable
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  CH {displayData.chainage} KM &bull; {task.direction || 'LHS'} &bull; {task.roadType || 'Main Carriageway'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Navigation Buttons Overlay */}
        <div className="absolute inset-y-0 left-4 flex items-center z-40 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); onPrevious && onPrevious(); }}
            disabled={!hasPrevious}
            className="transition-all hover:scale-110 disabled:opacity-50 disabled:pointer-events-none pointer-events-auto"
          >
            <img src={LeftArrowImg} alt="Previous" className="w-10 md:w-12 h-auto drop-shadow-xl" />
          </button>
        </div>

        <div className="absolute inset-y-0 right-4 flex items-center z-40 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
            disabled={!hasNext}
            className="transition-all hover:scale-110 disabled:opacity-50 disabled:pointer-events-none pointer-events-auto"
          >
            <img src={RightArrowImg} alt="Next" className="w-10 md:w-12 h-auto drop-shadow-xl" />
          </button>
        </div>

        {/* Fullscreen Button Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); setRotation(0); }} 
            className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors shadow-lg pointer-events-auto"
            title="Fullscreen"
          >
            <MdFullscreen size={24} />
          </button>
        </div>

        {/* Metadata Overlays */}
        <div className="absolute top-6 left-6 flex gap-2 pointer-events-none z-40">
          <div className="bg-black/70 backdrop-blur-md text-white px-5 py-2.5 rounded-lg text-lg font-semibold tracking-wider shadow-lg border border-white/20">
            CH {displayData.chainage} KM
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex gap-2 transition-opacity duration-300 opacity-70 group-hover:opacity-100 pointer-events-none z-40">
          {(latitude && longitude) && (
            <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded text-xs font-mono">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          )}
          {speed && (
            <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded text-xs font-mono">
              {speed} KM/H
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          >
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={8}
              centerOnInit={true}
              wheel={{ step: 0.02 }}
              doubleClick={{ step: 0.2 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Top Right Controls */}
                  <div className="absolute top-12 right-6 z-50 flex flex-col gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); zoomIn(0.1); }}
                      className="w-12 h-12 bg-[#4CAF50] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#45a049] hover:scale-105 transition-all text-2xl"
                    >
                      <MdZoomIn />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); zoomOut(0.1); }}
                      className="w-12 h-12 bg-[#4CAF50] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#45a049] hover:scale-105 transition-all text-2xl"
                    >
                      <MdZoomOut />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRotation(prev => prev + 90); }}
                      className="w-12 h-12 bg-[#4CAF50] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#45a049] hover:scale-105 transition-all text-2xl"
                    >
                      <MdRotateRight />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRotation(prev => prev - 90); }}
                      className="w-12 h-12 bg-[#4CAF50] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#45a049] hover:scale-105 transition-all text-2xl"
                    >
                      <MdRotateLeft />
                    </button>
                    
                    <div className="w-full h-px bg-white/20 my-1"></div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetTransform(); setIsFullScreen(false); }}
                      className="w-12 h-12 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-200 hover:scale-105 transition-all text-2xl"
                    >
                      <MdClose />
                    </button>
                  </div>

                  {/* Main Image View */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <motion.img
                        key={`fs-${task._id}-${activeView}`}
                        src={displayData.url}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: rotation
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
                        style={{ originX: 0.5, originY: 0.5 }}
                      />
                    </TransformComponent>
                  </div>

                  {/* Fullscreen Navigation Buttons */}
                  <div className="absolute inset-y-0 left-8 flex items-center z-40 pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetTransform(); onPrevious && onPrevious(); }}
                      disabled={!hasPrevious}
                      className="transition-all hover:scale-110 disabled:opacity-20 disabled:pointer-events-none pointer-events-auto"
                    >
                      <img src={LeftArrowImg} alt="Previous" className="w-14 h-auto drop-shadow-2xl" />
                    </button>
                  </div>

                  <div className="absolute inset-y-0 right-32 flex items-center z-40 pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetTransform(); onNext && onNext(); }}
                      disabled={!hasNext}
                      className="transition-all hover:scale-110 disabled:opacity-20 disabled:pointer-events-none pointer-events-auto"
                    >
                      <img src={RightArrowImg} alt="Next" className="w-14 h-auto drop-shadow-2xl" />
                    </button>
                  </div>
                </>
              )}
            </TransformWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageViewer;
