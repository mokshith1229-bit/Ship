import React from 'react';
import { MdSearch } from 'react-icons/md';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MdSearch className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl leading-5 bg-transparent placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5cb85c]/50 focus:border-[#5cb85c] focus:bg-white transition-all duration-300 sm:text-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
        placeholder="Search roads by name or SPV..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
