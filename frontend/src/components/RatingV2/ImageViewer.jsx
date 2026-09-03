import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ImageViewer = ({ task }) => {
  if (!task || !task.image || !task.image.cloudinaryUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        Inspection image unavailable
      </div>
    );
  }

  const { latitude, longitude, speed } = task.metadata || {};

  return (
    <div className="w-full h-full relative bg-[#0f1115] overflow-hidden group">
      <div className="w-full h-full">
        <TransformWrapper initialScale={1} minScale={0.5} maxScale={8} centerOnInit>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={task._id}
                    src={task.image.cloudinaryUrl}
                    alt={`Chainage ${task.chainage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-full max-h-full object-contain"
                  />
                </AnimatePresence>
              </TransformComponent>
              
              {/* Zoom Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
                <button onClick={() => zoomIn()} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur-sm transition-colors">+</button>
                <button onClick={() => zoomOut()} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur-sm transition-colors">-</button>
                <button onClick={() => resetTransform()} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs backdrop-blur-sm transition-colors">FIT</button>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Metadata Overlays */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded text-xs font-mono">
          CH {task.chainage} KM
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2 transition-opacity duration-300 opacity-70 group-hover:opacity-100">
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
  );
};

export default ImageViewer;
