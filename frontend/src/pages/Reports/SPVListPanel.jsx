import React from 'react';
import { MdSearch, MdChevronRight, MdPersonSearch } from 'react-icons/md';
import { motion } from 'framer-motion';

// Eager load all logos
const logos = import.meta.glob('../../assets/logos1/*.png', { eager: true, query: '?url', import: 'default' });

const getSpvLogo = (name) => {
  if (!name) return null;
  let normalized = name.toLowerCase();
  
  // Handle DB code to filename discrepancies
  if (normalized === 'datl') normalized = 'datrl';
  else if (normalized === 'jmtpl') normalized = 'jmtl';
  else if (normalized === 'ketpl') normalized = 'ketl';
  else if (normalized === 'kmtpl') normalized = 'kmtl';
  else if (normalized === 'mktpl') normalized = 'mktl';
  else if (normalized === 'smtpl') normalized = 'smtl';
  else if (normalized === 'nam') normalized = 'namel';
  else if (normalized === 'wmptl') normalized = 'wmp';

  // The keys in `logos` match the glob pattern exactly
  const key = `../../assets/logos1/${normalized}-1.png`;
  return logos[key] || null;
};

const SPVListPanel = ({ spvs, selectedSpvId, transitioningSpvId, onSelect, searchQuery, setSearchQuery }) => {
  const visibleSpvs = spvs.filter(spv => spv._id !== selectedSpvId);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">SPV Leaderboard</h2>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <MdPersonSearch className="text-xl" />
          </div>
        </div>
        
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text" 
            placeholder="Search SPV..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {visibleSpvs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No SPVs found.</div>
        ) : (
          visibleSpvs.map((spv) => {
            const isActive = transitioningSpvId === spv._id;
            
            // Get initials for Avatar
            const initials = spv.name ? spv.name.substring(0, 3).toUpperCase() : 'SPV';
            const logoUrl = getSpvLogo(spv.name);

            return (
              <motion.button
                layout
                layoutId={`spv-card-${spv._id}`}
                key={spv._id}
                whileHover={{ scale: isActive ? 1 : 1.01 }}
                whileTap={{ scale: isActive ? 1 : 0.98 }}
                onClick={() => onSelect(spv._id)}
                className={`w-full text-left rounded-[16px] p-4 flex gap-4 items-center transition-all duration-300 border ${
                  isActive 
                    ? 'border-green-500 bg-green-50/50 shadow-[0_8px_30px_rgba(34,197,94,0.2)] z-10 relative' 
                    : 'border-transparent bg-gray-50/50 hover:bg-gray-100 hover:shadow-sm'
                }`}
              >
                {/* Avatar / Logo */}
                <motion.div layoutId={`spv-logo-container-${spv._id}`} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-colors p-1 ${isActive ? 'bg-white border-2 border-green-500' : 'bg-white border border-gray-200'}`}>
                  {logoUrl ? (
                    <motion.img layoutId={`spv-logo-img-${spv._id}`} src={logoUrl} alt={spv.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <motion.div layoutId={`spv-logo-text-${spv._id}`} className={`text-sm font-bold transition-colors ${isActive ? 'text-green-600' : 'text-green-700'}`}>
                      {initials}
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Info */}
                <motion.div layoutId={`spv-info-${spv._id}`} className="flex-1 min-w-0 flex items-center">
                  <motion.h3 layoutId={`spv-name-${spv._id}`} className="font-bold text-gray-900 text-base truncate">{spv.name}</motion.h3>
                </motion.div>
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  );
};

export default SPVListPanel;
