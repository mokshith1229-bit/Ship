import React from 'react';

const getStatusConfig = (status) => {
  switch (status) {
    case 'ON-GOING':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-600',
        border: 'border-green-500/20',
        dot: 'bg-green-500 animate-pulse',
      };
    case 'HO-PROCESS':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20',
        dot: 'bg-blue-500',
      };
    case 'HO-RATED':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20',
        dot: 'bg-amber-500',
      };
    case 'SPV-RATED':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        border: 'border-purple-500/20',
        dot: 'bg-purple-500',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-600',
        border: 'border-gray-500/20',
        dot: 'bg-gray-500',
      };
  }
};

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {status.replace('-', ' ')}
    </div>
  );
};

export default StatusBadge;
