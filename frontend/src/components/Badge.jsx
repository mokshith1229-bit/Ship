import React from 'react';
import { cn } from '../utils/cn';

const Badge = ({ status }) => {
  const getBadgeStyle = (status) => {
    switch (status) {
      case 'HO-PROCESS':
        return 'bg-gray-200 text-gray-700';
      case 'HO-RATED':
        return 'bg-gray-800 text-white';
      case 'SPV-RATED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block text-center",
        getBadgeStyle(status)
      )}
    >
      {status}
    </span>
  );
};

export default Badge;
