import React from 'react';
import { motion } from 'framer-motion';

const DynamicGlowButton = ({ children, onClick, className = '', ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center px-6 py-2.5 font-bold text-white rounded-lg group overflow-hidden ${className}`}
      {...props}
    >
      {/* Animated glowing gradient background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 background-animate group-hover:scale-110 transition-transform duration-500"></div>
      
      {/* Soft inner shadow/glow */}
      <div className="absolute inset-0 w-full h-full bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity blur-md"></div>
      
      {/* Shine effect that sweeps across */}
      <div className="absolute inset-0 w-[200%] h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-shine"></div>

      <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">{children}</span>

      <style>{`
        .background-animate {
          background-size: 200% 200%;
          animation: gradientMove 3s ease infinite;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shine {
          100% { transform: translateX(50%); }
        }
      `}</style>
    </motion.button>
  );
};

export default DynamicGlowButton;
