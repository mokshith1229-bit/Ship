import React, { useRef, useEffect } from 'react';

const Premium3DButton = ({ 
  children, 
  loading, 
  disabled, 
  onClick, 
  type = "button",
  className = ""
}) => {
  const buttonRef = useRef(null);
  
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    let rafId = null;
    let targetX = 0.5; // Normalized center X
    let targetY = 0.5; // Normalized center Y
    let currentX = 0.5;
    let currentY = 0.5;
    let isHovered = false;

    // Linear interpolation for smooth easing
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const render = () => {
      // Smoothly approach target values
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);
      
      // Calculate dynamic values for CSS variables (-1 to 1)
      const xOffset = (currentX - 0.5) * 2; 
      const yOffset = (currentY - 0.5) * 2; 
      
      if (isHovered) {
        // Multiply offset for pixel translation of shadows
        const shadowX = xOffset * 10;
        const shadowY = yOffset * 10;
        
        btn.style.setProperty('--shadow-x', `${-shadowX}px`);
        btn.style.setProperty('--shadow-y', `${-shadowY}px`);
        btn.style.setProperty('--light-x', `${currentX * 100}%`);
        btn.style.setProperty('--light-y', `${currentY * 100}%`);
        btn.style.setProperty('--hover-opacity', '1');
      } else {
        // Return to center and fade out glow when not hovered
        targetX = 0.5;
        targetY = 0.5;
        btn.style.setProperty('--hover-opacity', '0');
        btn.style.setProperty('--shadow-x', `0px`);
        btn.style.setProperty('--shadow-y', `0px`);
      }
      
      rafId = requestAnimationFrame(render);
    };
    
    rafId = requestAnimationFrame(render);

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };
    
    const handleMouseLeave = () => {
      isHovered = false;
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseenter', handleMouseEnter);
    btn.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseenter', handleMouseEnter);
      btn.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`premium-3d-btn relative px-6 py-2 text-white font-medium rounded-lg disabled:opacity-50 h-[38px] overflow-visible outline-none group border border-transparent transition-all duration-300 flex items-center justify-center gap-2 ${className}`}
      style={{
        '--shadow-x': '0px',
        '--shadow-y': '0px',
        '--light-x': '50%',
        '--light-y': '50%',
        '--hover-opacity': '0',
        willChange: 'transform, box-shadow, background'
      }}
    >
      <style>
        {`
          .premium-3d-btn {
            /* Base static shadow when not hovered */
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            background: #15803d; /* Dark green base */
          }
          
          /* The dynamic hover state with GPU acceleration */
          .premium-3d-btn:not(:disabled):hover {
            transform: translateY(-1px);
            
            /* Layered dynamic shadows */
            box-shadow: 
              inset calc(var(--shadow-x) * -0.6) calc(var(--shadow-y) * -0.6) 8px rgba(255, 255, 255, 0.4),
              inset calc(var(--shadow-x) * 0.4) calc(var(--shadow-y) * 0.4) 10px rgba(0, 0, 0, 0.2),
              calc(var(--shadow-x) * 1.2) calc(var(--shadow-y) * 1.2 + 4px) 15px rgba(21, 128, 61, 0.4),
              calc(var(--shadow-x) * 2) calc(var(--shadow-y) * 2) 40px rgba(248, 113, 113, calc(var(--hover-opacity) * 0.25)); 
            
            /* Dynamic radial gradient light effect tracking cursor */
            background: radial-gradient(
              circle 70px at var(--light-x) var(--light-y), 
              #4ade80 0%,   /* Bright light green highlight at cursor */
              #22c55e 40%,  /* Smooth light green glow */
              #15803d 100%  /* Seamlessly blends into the base dark green */
            );
            border-color: rgba(255,255,255,0.3);
          }
          
          .premium-3d-btn:disabled {
            cursor: not-allowed;
            background: #166534; /* Disabled dark green */
          }


          
          @media (prefers-reduced-motion: reduce) {
            .premium-3d-btn {
              transition: none !important;
              transform: none !important;
            }
            .premium-3d-btn:not(:disabled):hover {
              box-shadow: 0 4px 12px rgba(21, 128, 61, 0.4) !important;
              background: #16a34a !important;
            }
          }
        `}
      </style>
      <span className="relative z-10 pointer-events-none drop-shadow-sm tracking-wide flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default Premium3DButton;
