import React from 'react';
import { MdOutlineArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const InspectionHeader = ({ task }) => {
  const navigate = useNavigate();

  if (!task) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/rating')}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          title="Back to Rating"
        >
          <MdOutlineArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">HiRATE V2</h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Inspection Command Center</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <HeaderItem label="Project" value={task.project?.name || task.project} />
        <HeaderItem label="Asset" value={task.assetSubType ? `${task.assetType} (${task.assetSubType})` : task.assetType} />
        <HeaderItem label="Direction" value={task.direction} />
        <HeaderItem label="Road" value={task.roadType} />
        <HeaderItem label="Chainage" value={`${task.chainage} km`} highlight />
      </div>
    </div>
  );
};

const HeaderItem = ({ label, value, highlight }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
    <span className={`text-sm font-semibold ${highlight ? 'text-green-600' : 'text-gray-800'}`}>
      {value || '-'}
    </span>
  </div>
);

export default InspectionHeader;
