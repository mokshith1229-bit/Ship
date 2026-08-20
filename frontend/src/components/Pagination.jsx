import React from 'react';
import { cn } from '../utils/cn';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);
    
    if (currentPage === 1) {
      endPage = 3;
    } else if (currentPage === totalPages) {
      startPage = totalPages - 2;
    }

    const pages = [];
    
    if (startPage > 2) {
      pages.push(1);
      pages.push('...back');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      pages.push('...forward');
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full py-6 mt-4">
      {/* Previous Button */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className={cn(
          "flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 rounded-full border bg-white text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5cb85c]/40",
          currentPage === 1
            ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-60"
            : "border-gray-200 text-gray-600 hover:border-[#5cb85c] hover:text-[#5cb85c] hover:bg-green-50 shadow-sm hover:shadow"
        )}
      >
        <MdArrowBack className="text-[18px]" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {visiblePages.map((page, index) => {
          if (typeof page === 'string' && page.startsWith('...')) {
            const isBack = page === '...back';
            return (
              <button 
                key={`ellipsis-${index}`} 
                onClick={() => onPageChange(isBack ? Math.max(1, currentPage - 1) : Math.min(totalPages, currentPage + 1))}
                className="flex items-center justify-center w-8 h-10 sm:w-10 text-gray-400 font-medium tracking-wider hover:text-[#5cb85c] transition-colors focus:outline-none"
                aria-label={isBack ? "Jump backward" : "Jump forward"}
              >
                ...
              </button>
            );
          }

          const isActive = currentPage === page;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "relative overflow-hidden group w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5cb85c]/50",
                isActive
                  ? "bg-[#5cb85c] border-[#5cb85c] shadow-[0_4px_12px_rgba(92,184,92,0.3)] scale-110 z-10"
                  : "bg-white border-gray-200 hover:border-[#5cb85c] shadow-sm hover:shadow"
              )}
            >
              {/* Upward fill hover animation layer */}
              {!isActive && (
                <span className="absolute inset-0 bg-[#5cb85c] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-[350ms] ease-out z-0 pointer-events-none"></span>
              )}
              
              <span className={cn(
                "relative z-10 transition-colors duration-[350ms] text-sm font-medium ease-out",
                isActive ? "text-white" : "text-gray-700 group-hover:text-white"
              )}>
                {page}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className={cn(
          "flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 rounded-full border bg-white text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5cb85c]/40",
          currentPage === totalPages
            ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-60"
            : "border-gray-200 text-gray-600 hover:border-[#5cb85c] hover:text-[#5cb85c] hover:bg-green-50 shadow-sm hover:shadow"
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <MdArrowForward className="text-[18px]" />
      </button>
    </div>
  );
};

export default Pagination;
