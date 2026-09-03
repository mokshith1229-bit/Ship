import React from 'react';
import { MdSkipNext, MdNavigateBefore, MdNavigateNext } from 'react-icons/md';

const RatingNavigation = ({ onPrevious, onNext, onSaveAndNext, onSkip, canGoPrevious, canGoNext, saving }) => {
  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={onPrevious}
        disabled={!canGoPrevious || saving}
        className="flex-1 flex items-center justify-center gap-1 py-3 px-4 rounded font-semibold text-sm border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <MdNavigateBefore size={18} /> Previous
      </button>
      
      <button 
        onClick={onSkip}
        disabled={saving}
        className="flex items-center justify-center gap-1 py-3 px-4 rounded font-semibold text-sm border border-gray-200 text-gray-600 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <MdSkipNext size={18} /> Skip
      </button>
      
      <button 
        onClick={onSaveAndNext}
        disabled={saving}
        className="flex-[2] flex items-center justify-center gap-1 py-3 px-4 rounded font-semibold text-sm bg-green-600 text-white hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Save & Next <MdNavigateNext size={18} />
      </button>
    </div>
  );
};

export default RatingNavigation;
