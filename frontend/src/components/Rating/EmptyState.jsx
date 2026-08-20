import React from 'react';
import { MdSearchOff } from 'react-icons/md';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-64 bg-white/50 backdrop-blur-sm border border-white/20 rounded-3xl col-span-full">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <MdSearchOff className="text-4xl text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">No Roads Found</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        We couldn't find any roads matching your current search or filter criteria. Try adjusting your keywords.
      </p>
    </div>
  );
};

export default EmptyState;
