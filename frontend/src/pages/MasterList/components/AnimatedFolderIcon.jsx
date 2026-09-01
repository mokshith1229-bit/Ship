import React from 'react';

const AnimatedFolderIcon = ({ className }) => {
  return (
    <div className={`relative w-20 h-20 flex items-center justify-center ${className}`}>
      <style>
        {`
          .folder-svg-container {
            width: 100%;
            height: 100%;
            overflow: visible;
          }
          
          .folder-doc {
            transition: transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
            transform: translateY(0);
          }
          
          /* The 'group' class is on the parent card, so group-hover triggers this */
          .group:hover .folder-doc {
            transform: translateY(-35px);
          }
          
          @media (prefers-reduced-motion: reduce) {
            .folder-doc {
              transition: none !important;
              transform: translateY(0) !important;
            }
          }
        `}
      </style>
      
      <svg viewBox="0 0 100 100" className="folder-svg-container">
        {/* Back Folder Flap */}
        <path 
          d="M8 26 C8 23 10 21 13 21 L38 21 C41 21 43 23 45 26 L51 34 L87 34 C90 34 92 36 92 39 L92 85 C92 88 90 90 87 90 L13 90 C10 90 8 88 8 85 Z" 
          fill="currentColor" 
          opacity="0.8" 
        />
        
        {/* Document Group (Animated) */}
        <g className="folder-doc">
          {/* Document Base */}
          <rect 
            x="18" 
            y="26" 
            width="64" 
            height="62" 
            rx="4" 
            fill="#ffffff" 
            stroke="#1e293b" 
            strokeWidth="1.5" 
          />
          
          {/* Document Header Line (Enterprise styling) */}
          <rect x="26" y="36" width="24" height="3" rx="1.5" fill="#64748b" />
          
          {/* Document Body Lines */}
          <rect x="26" y="46" width="48" height="2" rx="1" fill="#cbd5e1" />
          <rect x="26" y="52" width="42" height="2" rx="1" fill="#cbd5e1" />
          <rect x="26" y="58" width="48" height="2" rx="1" fill="#cbd5e1" />
          <rect x="26" y="64" width="36" height="2" rx="1" fill="#cbd5e1" />
          
          {/* Small Badge/Icon on Document */}
          <rect x="64" y="34" width="10" height="10" rx="2" fill="#22c55e" opacity="0.9" />
        </g>

        {/* Front Folder Flap */}
        <path 
          d="M8 46 C8 43 10 41 13 41 L87 41 C90 41 92 43 92 46 L92 85 C92 88 90 90 87 90 L13 90 C10 90 8 88 8 85 Z" 
          fill="currentColor" 
        />
        
        {/* Folder Front Inner Shadow/Crease */}
        <path 
          d="M8 46 C8 43 10 41 13 41 L87 41 C90 41 92 43 92 46" 
          fill="none" 
          stroke="rgba(255,255,255,0.25)" 
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

export default AnimatedFolderIcon;
