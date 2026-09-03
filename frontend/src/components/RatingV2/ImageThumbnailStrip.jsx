import React from 'react';
import { motion } from 'framer-motion';

const ImageThumbnailStrip = ({ task }) => {
  if (!task || !task.image) return null;

  return (
    <div className="flex items-center gap-3 px-4 h-full">
      {task.previousImage && (
        <Thumbnail url={task.previousImage.url} chainage={task.previousImage.chainage} active={false} />
      )}
      
      {task.image.cloudinaryUrl && (
        <Thumbnail url={task.image.cloudinaryUrl} chainage={task.chainage} active={true} />
      )}
      
      {task.nextImage && (
        <Thumbnail url={task.nextImage.url} chainage={task.nextImage.chainage} active={false} />
      )}
    </div>
  );
};

const Thumbnail = ({ url, chainage, active }) => {
  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
          active ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] scale-110' : 'border-transparent opacity-60 hover:opacity-100'
        }`}
      >
        <img src={url} alt={`Chainage ${chainage}`} className="w-full h-full object-cover" />
      </div>
      <span className={`text-[10px] font-mono ${active ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
        {chainage}
      </span>
    </div>
  );
};

export default ImageThumbnailStrip;
