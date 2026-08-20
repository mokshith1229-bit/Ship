import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SegmentedFilters = ({ filters, activeFilter, onFilterChange }) => {
  const [hoveredFilter, setHoveredFilter] = useState(null);

  return (
    <nav 
      className="flex items-center p-1 rounded-[20px] w-fit border-2 border-[#5cb85c] bg-white shadow-sm"
      onMouseLeave={() => setHoveredFilter(null)}
      aria-label="Road Filter Navigation"
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const isHovered = hoveredFilter === filter.id;
        // The background rests on hovered item, or falls back to active if nothing is hovered
        const hasBackground = hoveredFilter ? isHovered : isActive;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            onMouseEnter={() => setHoveredFilter(filter.id)}
            className={`relative px-5 py-2 text-sm font-medium rounded-2xl transition-colors duration-200 z-10 ${
              hasBackground ? 'text-[#FFF176]' : 'text-gray-600'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {hasBackground && (
              <motion.div
                layoutId="magic-pill"
                className="absolute inset-0 bg-[#5cb85c] rounded-[14px] -z-10 shadow-sm"
                initial={false}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <span className="relative z-10 tracking-wide">{filter.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default SegmentedFilters;
