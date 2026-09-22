import React from 'react';
import './HiRateRoadLoader.css';

const HiRateRoadLoader = ({ message, size = 'medium' }) => {
  return (
    <div className={`hirate-road-loader-container ${size}`}>
      <div className={`hirate-road-loader-wrapper ${size}`}>
        <svg viewBox="0 0 100 100" className="road-loader-svg" aria-label="Loading">
          <defs>
            <filter id="green-glow-loader" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
            </linearGradient>
          </defs>
          
          {/* Base Road (Dark Gray) */}
          <circle cx="50" cy="50" r="40" stroke="#4b5563" strokeWidth="14" fill="none" />
          
          {/* Dashed Center Line (White) */}
          <circle 
            cx="50" cy="50" r="40" 
            stroke="rgba(255,255,255,0.7)" 
            strokeWidth="2" 
            strokeDasharray="6 8" 
            fill="none" 
            className="road-markings" 
          />
          
          {/* Rotating Group containing Trail and Car */}
          <g className="road-rotating-group">
            {/* Green Trail (Follows the car, so it's drawn behind it) 
                Car is at (50,10) moving right (clockwise).
                Trail goes from top-left roughly to top-center.
            */}
            <path 
              d="M 15.35 30 A 40 40 0 0 1 50 10" 
              stroke="#22c55e" 
              strokeWidth="14" 
              fill="none" 
              strokeLinecap="round"
              filter="url(#green-glow-loader)"
              className="green-trail"
              opacity="0.9"
            />
            
            {/* White Car */}
            <g transform="translate(50, 10) rotate(0)">
              {/* Shadow */}
              <rect x="-9" y="-6" width="18" height="12" rx="4" fill="rgba(0,0,0,0.3)" filter="blur(2px)" />
              {/* Car Body */}
              <rect x="-8" y="-5" width="16" height="10" rx="3" fill="#ffffff" />
              {/* Windshield */}
              <rect x="0" y="-4" width="4" height="8" rx="1" fill="#64748b" />
              {/* Rear Window */}
              <rect x="-6" y="-4" width="3" height="8" rx="1" fill="#64748b" />
              {/* Headlights */}
              <rect x="7" y="-4" width="2" height="2" rx="0.5" fill="#fef08a" />
              <rect x="7" y="2" width="2" height="2" rx="0.5" fill="#fef08a" />
            </g>
          </g>
        </svg>
      </div>
      {message && <div className={`hirate-road-loader-text ${size}`}>{message}</div>}
    </div>
  );
};

export default HiRateRoadLoader;
