import React, { useState, useRef } from 'react';
import { MdCheckCircle, MdCancel, MdError, MdDateRange } from 'react-icons/md';

const ImageZoom = ({ src, alt }) => {
  const [zoomState, setZoomState] = useState({ show: false, x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setZoomState({ 
      show: true, 
      x: Math.max(0, Math.min(1, x)), 
      y: Math.max(0, Math.min(1, y))
    });
  };

  return (
    <div 
      className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden cursor-crosshair border border-gray-200"
      onMouseEnter={() => setZoomState(prev => ({ ...prev, show: true }))}
      onMouseLeave={() => setZoomState(prev => ({ ...prev, show: false }))}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        style={
          zoomState.show && src && !src.includes('placeholder.com')
            ? {
                transform: 'scale(3.5)',
                transformOrigin: `${zoomState.x * 100}% ${zoomState.y * 100}%`,
                transition: 'transform 0.2s ease-out'
              }
            : {
                transform: 'scale(1)',
                transformOrigin: 'center center',
                transition: 'transform 0.4s ease-out'
              }
        }
      />
    </div>
  );
};

const ChainageIntelligence = ({ chainages, analytics }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const imageComparisonRef = useRef(null);

  if (!chainages || chainages.length === 0) return null;

  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s === 'improved') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Improved</span>;
    if (s === 'deteriorated') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Deteriorated</span>;
    if (s === 'unresolved') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Unresolved</span>;
    if (s === 'not rated') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">Not Rated</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">No Change</span>;
  };

  const getRatingBadge = (rating) => {
    if (rating === null || rating === undefined || rating === '') return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold text-sm">Not Rated</span>;
    const val = Number(rating);
    if (isNaN(val)) return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold text-sm">Not Rated</span>;
    if (val === 0) return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold text-sm">N/A</span>;
    
    if (val === 10) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-sm">10</span>;
    if (val === 5) return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold text-sm">5</span>;
    if (val === 1) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-sm">1</span>;
    return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-sm">{val}</span>;
  };

  const filteredChainages = chainages.filter(c => {
    const s = c.status?.toLowerCase() || 'not rated';
    const isNotRated = isNaN(c.ratingA) || isNaN(c.ratingB) || c.ratingA === null || c.ratingB === null;
    
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Not Rated') return isNotRated;
    return s === filterStatus.toLowerCase() && !isNotRated;
  });

  let improvedCount = 0;
  let deterioratedCount = 0;
  let unresolvedCount = 0;
  let noChangeCount = 0;

  chainages.forEach(r => {
    if (!(isNaN(r.ratingA) || isNaN(r.ratingB) || r.ratingA === null || r.ratingB === null)) {
      if (r.status === 'Improved') improvedCount++;
      else if (r.status === 'Deteriorated') deterioratedCount++;
      else if (r.status === 'Unresolved') unresolvedCount++;
      else noChangeCount++;
    }
  });

  const handleRowClick = (idx) => {
    if (selectedRow === idx) {
      setSelectedRow(null); 
    } else {
      setSelectedRow(idx);
      setTimeout(() => {
        imageComparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Pagination for Prev/Next within the filtered array
  const currentFilteredIndex = selectedRow !== null ? filteredChainages.indexOf(chainages[selectedRow]) : -1;
  const hasPrevious = currentFilteredIndex > 0;
  const hasNext = currentFilteredIndex !== -1 && currentFilteredIndex < filteredChainages.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      const prevItem = filteredChainages[currentFilteredIndex - 1];
      setSelectedRow(chainages.indexOf(prevItem));
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextItem = filteredChainages[currentFilteredIndex + 1];
      setSelectedRow(chainages.indexOf(nextItem));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center border-b-4 border-b-[#00A651] w-full">
            <span className="text-2xl font-black text-gray-800">{analytics?.rawTaskCountA !== undefined ? analytics.rawTaskCountA : (analytics?.totalA || 0)}</span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">Prev. Month Inspections</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center border-b-4 border-b-[#00A651] w-full">
            <span className="text-2xl font-black text-gray-800">{analytics?.rawTaskCountB !== undefined ? analytics.rawTaskCountB : (analytics?.totalB || 0)}</span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">Curr. Month Inspections</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center border-b-4 border-b-[#00A651] w-full">
            <span className="text-2xl font-black text-gray-800">{improvedCount}</span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">Improved</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center border-b-4 border-b-[#00A651] w-full">
            <span className="text-2xl font-black text-gray-800">{deterioratedCount}</span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">Deteriorated</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center border-b-4 border-b-[#00A651] w-full">
            <span className="text-2xl font-black text-gray-800">{unresolvedCount}</span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">Unresolved</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center border-b-4 border-b-[#00A651] w-full">
            <span className="text-2xl font-black text-gray-800">{noChangeCount}</span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">No Change</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 tracking-wider uppercase">Chainage Changes</h2>
            <span className="text-sm font-medium text-gray-500">({filteredChainages.length} results)</span>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 overflow-x-auto w-full lg:w-auto">
            {['All', 'Improved', 'Deteriorated', 'Unresolved', 'No Change', 'Not Rated'].map(status => (
              <button
                key={status}
                onClick={() => { setFilterStatus(status); setSelectedRow(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${filterStatus === status ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Chainage</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Parameter</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100 text-center">Previous Rating</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100 text-center">Current Rating</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100 text-center">Change</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredChainages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-medium">No results found for this filter.</td>
                </tr>
              ) : (
                filteredChainages.map((item, idx) => {
                  const originalIndex = chainages.indexOf(item);
                  return (
                    <tr 
                      key={originalIndex}
                      onClick={() => handleRowClick(originalIndex)}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${selectedRow === originalIndex ? 'bg-blue-50' : 'bg-white'}`}
                    >
                      <td className="py-4 px-6 font-bold text-gray-800 whitespace-nowrap">
                        {Number(item.chainage).toFixed(3)}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-700">{item.parameter || '-'}</td>
                      <td className="py-4 px-6 text-center">{getRatingBadge(item.ratingA)}</td>
                      <td className="py-4 px-6 text-center">{getRatingBadge(item.ratingB)}</td>
                      <td className={`py-4 px-6 font-bold text-center ${item.diff > 0 ? 'text-green-600' : item.diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {item.diff !== null ? (item.diff > 0 ? `+${item.diff}` : item.diff) : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isNaN(item.ratingA) || isNaN(item.ratingB) || item.ratingA === null || item.ratingB === null ? getStatusBadge('Not Rated') : getStatusBadge(item.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow !== null && chainages[selectedRow] && (
        <div ref={imageComparisonRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in mt-4">
          <div className="flex flex-col mb-6 pb-4 border-b border-gray-100 text-center relative">
            <h3 className="text-xl font-bold text-gray-800 tracking-wider">
              CHAINAGE: {Number(chainages[selectedRow].chainage).toFixed(3)}
            </h3>
            <p className="text-sm font-bold text-gray-500 uppercase mt-1">
              PARAMETER: {chainages[selectedRow].parameter}
            </p>
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none">
              <button 
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${hasPrevious ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
              >
                &larr; Previous
              </button>
              <button 
                onClick={handleNext}
                disabled={!hasNext}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${hasNext ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
              >
                Next &rarr;
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <div className="text-center font-bold text-gray-700 uppercase tracking-widest mb-4 bg-gray-100 py-2 rounded-lg">
                PREVIOUS MONTH
              </div>
              <ImageZoom 
                src={chainages[selectedRow].imageA || 'https://via.placeholder.com/800x600?text=No+Image'} 
                alt="Previous" 
              />
              <div className="mt-4 flex flex-col gap-3 px-2">
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Asset Type</span>
                  <span className="font-semibold text-gray-800 text-sm text-right w-2/3">{chainages[selectedRow].asset || '-'}</span>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Parameter</span>
                  <span className="font-bold text-gray-800 text-sm text-right w-2/3">{chainages[selectedRow].parameter || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Rating</span>
                  <div className="text-right w-2/3">{getRatingBadge(chainages[selectedRow].ratingA)}</div>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Remark</span>
                  <span className="font-semibold text-gray-800 text-sm text-right w-2/3">{chainages[selectedRow].remarkA || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Date</span>
                  <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 text-right justify-end w-2/3">
                    <MdDateRange className="text-blue-500" />
                    {chainages[selectedRow].dateA ? new Date(chainages[selectedRow].dateA).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-center font-bold text-gray-700 uppercase tracking-widest mb-4 bg-gray-100 py-2 rounded-lg">
                CURRENT MONTH
              </div>
              <ImageZoom 
                src={chainages[selectedRow].imageB || 'https://via.placeholder.com/800x600?text=No+Image'} 
                alt="Current" 
              />
              <div className="mt-4 flex flex-col gap-3 px-2">
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Asset Type</span>
                  <span className="font-semibold text-gray-800 text-sm text-right w-2/3">{chainages[selectedRow].asset || '-'}</span>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Parameter</span>
                  <span className="font-bold text-gray-800 text-sm text-right w-2/3">{chainages[selectedRow].parameter || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Rating</span>
                  <div className="text-right w-2/3">{getRatingBadge(chainages[selectedRow].ratingB)}</div>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Remark</span>
                  <span className="font-semibold text-gray-800 text-sm text-right w-2/3">{chainages[selectedRow].remarkB || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Date</span>
                  <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 text-right justify-end w-2/3">
                    <MdDateRange className="text-blue-500" />
                    {chainages[selectedRow].dateB ? new Date(chainages[selectedRow].dateB).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase w-1/3">Status</span>
                  <div className="text-right w-2/3">{getStatusBadge(chainages[selectedRow].status)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainageIntelligence;
