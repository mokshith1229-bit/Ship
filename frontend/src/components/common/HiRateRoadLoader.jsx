import React from 'react';
import './HiRateRoadLoader.css';

const HiRateRoadLoader = ({ size = 'medium', message }) => {
  return (
    <div 
      className="hirate-loader-wrapper"
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="hirate-road-loader-container" data-size={size}>
        <svg className="hirate-road-svg" viewBox="0 0 100 100">
          <defs>
            {/* Soft Green Glow for the Trail */}
            <filter id="hirate-trail-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="1.5" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Car drop shadow */}
            <filter id="hirate-car-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* LAYER 1: STATIC ROAD */}
          <g className="hirate-static-road">
            {/* Outer Gray Border */}
            <circle cx="50" cy="50" r="35" className="hirate-road-border" />
            {/* Dark Charcoal Road Surface */}
            <circle cx="50" cy="50" r="35" className="hirate-road-surface" />
            {/* White Dashed Lane Markings */}
            <circle cx="50" cy="50" r="35" className="hirate-road-dashed" />
          </g>

          {/* ROTATING LAYER: Car + Glow */}
          <g className="hirate-road-rotating-group">
            
            {/* LAYER 2: DYNAMIC GREEN GLOW / NITRO TRAIL */}
            {/* 
              Positioned exactly on the track (r=35). 
              The stroke draws clockwise. 
              We want it to trail BEHIND the car (which is at the very top, 0 degrees).
              A normal circle starts at 90deg (3 o'clock).
              To make it end exactly at 0deg, we rotate the circle back by its length + 90deg. 
            */}
            <circle 
              cx="50" cy="50" r="35" 
              className="hirate-road-glow-trail" 
              filter="url(#hirate-trail-glow)" 
            />

            {/* LAYER 3: CAR */}
            {/* Center of the track top point is at (50, 15). 
                We place a 20x34 SVG car centered there. x=40, y=-2 */}
            <g className="hirate-road-car-wrapper" filter="url(#hirate-car-shadow)">
              <svg x="40" y="-2" width="20" height="34" viewBox="0 0 20 34" className="hirate-detailed-car">
                {/* Left/Right Side Mirrors */}
                <rect x="0" y="14" width="2" height="5" rx="1" fill="#475569" />
                <rect x="18" y="14" width="2" height="5" rx="1" fill="#475569" />
                
                {/* Main White Body */}
                <rect x="2" y="2" width="16" height="30" rx="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                
                {/* Dark Windshield */}
                <path d="M 3.5 13 L 16.5 13 L 14.5 7 L 5.5 7 Z" fill="#1e293b" />
                
                {/* Dark Rear Window */}
                <path d="M 4 23 L 16 23 L 15 28 L 5 28 Z" fill="#1e293b" />
                
                {/* Roof panel / subtle lines */}
                <rect x="5" y="14" width="10" height="8" rx="2" fill="#f1f5f9" />
                
                {/* Headlights (Subtle white/yellow) */}
                <rect x="3.5" y="2" width="3" height="2" rx="1" fill="#fef08a" opacity="0.8" />
                <rect x="13.5" y="2" width="3" height="2" rx="1" fill="#fef08a" opacity="0.8" />
                
                {/* Red Tail Lights */}
                <rect x="3.5" y="30.5" width="4" height="1.5" rx="0.5" fill="#ef4444" />
                <rect x="12.5" y="30.5" width="4" height="1.5" rx="0.5" fill="#ef4444" />
              </svg>
            </g>
          </g>
        </svg>
      </div>
      
      {/* Loading Message */}
      {message && (
        <div className="hirate-loader-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default HiRateRoadLoader;
