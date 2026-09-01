import React from 'react';
import { motion } from 'framer-motion';
import { MdLayers, MdViewModule, MdSecurity } from 'react-icons/md';

const KPICard = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-borderColor rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between"
    >
      <div>
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{item.title}</h3>
        <h2 className="text-2xl font-black text-gray-800">{item.value}</h2>
      </div>
      <div className={`p-3 rounded-lg ${item.bg} text-2xl shadow-inner`}>
        {item.icon}
      </div>
    </motion.div>
  );
};

const RoleKPICards = ({ stats }) => {
  const kpiData = [
    {
      title: 'Total Features',
      value: stats.totalFeatures || 0,
      icon: <MdLayers className="text-blue-500" />,
      bg: 'bg-blue-50'
    },
    {
      title: 'Modules',
      value: stats.totalModules || 0,
      icon: <MdViewModule className="text-indigo-500" />,
      bg: 'bg-indigo-50'
    },
    {
      title: 'Active Permissions',
      value: stats.activePermissions || 0,
      icon: <MdSecurity className="text-purple-500" />,
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {kpiData.map((item, index) => (
        <KPICard key={index} item={item} index={index} />
      ))}
    </div>
  );
};

export default RoleKPICards;
