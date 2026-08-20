import React from 'react';
import { cn } from '../utils/cn';
import { MdOutlineFilterCenterFocus, MdOutlineAccessTime, MdOutlineInfo, MdOutlineCheckCircleOutline, MdOutlineCancel } from 'react-icons/md';

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { name: 'ALL ROADS', icon: MdOutlineFilterCenterFocus, id: 'all' },
    { name: 'HO-PROCESS', icon: MdOutlineAccessTime, id: 'ho-process' },
    { name: 'ON-GOING', icon: MdOutlineInfo, id: 'on-going' },
    { name: 'SPV-RATED', icon: MdOutlineAccessTime, id: 'spv-rated' },
    { name: 'HO-RATED', icon: MdOutlineCheckCircleOutline, id: 'ho-rated' },
    { name: 'NOT-RATED', icon: MdOutlineCancel, id: 'not-rated' },
  ];

  return (
    <div className="flex items-center gap-2 mb-6 border-b border-borderColor pb-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-md",
              isActive
                ? "bg-primary text-white"
                : "bg-white text-primary hover:bg-blue-50"
            )}
          >
            <Icon className="text-lg" />
            {tab.name}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
