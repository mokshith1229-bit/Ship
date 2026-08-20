import React from 'react';
import { cn } from '../../utils/cn';

const LegendBadge = ({ variant = 'allowed', children }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap",
        variant === 'allowed'
          ? "bg-[#4CAF50] text-white"
          : "bg-[#B0B3B8] text-[#1D1E20]"
      )}
    >
      {children}
    </span>
  );
};

export default LegendBadge;
