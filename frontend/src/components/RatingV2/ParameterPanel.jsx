import React, { useState, useEffect } from 'react';
import CustomDropdown from '../common/CustomDropdown';
import { resolveRemarkRating } from '../../utils/remarkRatingResolver';
import { MdClose } from 'react-icons/md';

const ParameterPanel = ({ task, params, ratings, onChange, onOpenMissing }) => {
  const [remarkMasterConfig, setRemarkMasterConfig] = useState({});
  const [customRemarkMode, setCustomRemarkMode] = useState({});

  useEffect(() => {
    fetch('/remarkMaster.json')
      .then(res => res.json())
      .then(data => setRemarkMasterConfig(data))
      .catch(err => console.error('Failed to load remarkMaster.json', err));
  }, []);

  if (!task || !params || params.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
        <p className="text-lg font-medium mb-2">No standard parameters configured for this asset.</p>
        <p className="text-sm">You can still add custom questions if necessary.</p>
        <div className="mt-6">
          <button 
            onClick={onOpenMissing}
            className="px-4 py-2 bg-green-50 text-green-700 font-semibold rounded hover:bg-green-100 flex items-center gap-2 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Missing Question
          </button>
        </div>
      </div>
    );
  }

  const currentCategory = task?.category || 'N/A';
  const categoryRemarks = remarkMasterConfig[currentCategory] || [];
  
  // Try to load custom remarks if available
  let allCustomRemarks = [];
  try {
    allCustomRemarks = Object.values(JSON.parse(localStorage.getItem('userCustomRemarks')) || {}).flat();
  } catch (e) {}

  const currentTaskRemarks = Object.values(ratings || {}).map(r => r.remark).filter(r => r && r !== 'Other');

  const groupedParams = params.reduce((acc, param) => {
    const groupName = param.group || param.assetType || currentCategory;
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(param);
    return acc;
  }, {});

  const renderParamCard = (param) => {
    const pId = param.parameterKey || param._id || param.masterListId;
    const r = ratings[pId];
    const score = r ? r.score : null;
    const remark = r ? r.remark : '';

    const paramCategory = param.category || param.assetType || currentCategory;
    const paramMasterRemarks = remarkMasterConfig[paramCategory] || [];
    const combinedMasterRemarks = [...new Set([...categoryRemarks, ...paramMasterRemarks])];
    const dynamicRemarkOptions = [...new Set([...combinedMasterRemarks, ...allCustomRemarks, ...currentTaskRemarks]), 'Other'];

    return (
      <div key={pId} className="flex flex-col gap-3 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">{param.parameterName || param.parameter}</h3>

        <div className="flex gap-2 mt-2">
          <ScoreButton value={10} selectedScore={score} label="Excellent" onClick={() => onChange(pId, 10, remark)} />
          <ScoreButton value={5} selectedScore={score} label="Fair" onClick={() => onChange(pId, 5, remark)} />
          <ScoreButton value={1} selectedScore={score} label="Poor" onClick={() => onChange(pId, 1, remark)} />
          <ScoreButton value={0} selectedScore={score} label="Very Poor" onClick={() => onChange(pId, 0, remark)} />
        </div>

        <div className="mt-2">
          {customRemarkMode[pId] || (remark && !dynamicRemarkOptions.includes(remark) && remark !== 'Other' && remark !== 'Rectified' && remark !== 'Not Rectified') ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={remark === 'Other' ? '' : remark}
                onChange={(e) => onChange(pId, score, e.target.value)}
                placeholder="Enter custom remark..."
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-all placeholder-gray-400"
              />
              <button
                onClick={() => {
                  onChange(pId, score, '');
                  setCustomRemarkMode(prev => ({ ...prev, [pId]: false }));
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Cancel custom remark"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
          ) : (
            <CustomDropdown
              className={`remark-${pId} text-sm`}
              options={dynamicRemarkOptions}
              value={remark}
              onChange={(val) => {
                if (val === 'Other') {
                  setCustomRemarkMode(prev => ({ ...prev, [pId]: true }));
                  onChange(pId, '5', '');
                } else {
                  let newScore = score;
                  if (val && val.toLowerCase() === 'rectified') {
                    newScore = '10';
                  } else if (val && val.toLowerCase() === 'not rectified') {
                    newScore = '5';
                  } else if (val && (val.toLowerCase() === 'not applicable' || val.toLowerCase() === 'na' || val.toLowerCase() === 'n/a')) {
                    newScore = '0';
                  } else {
                    const resolvedScore = resolveRemarkRating('', val);
                    if (resolvedScore !== null) {
                      newScore = resolvedScore;
                    }
                  }
                  onChange(pId, newScore, val);
                }
              }}
              placeholder="Add observation/remark (optional)..."
              direction="up"
              searchable={true}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(groupedParams).map(([groupName, groupParams]) => (
        <div key={groupName} className="flex flex-col gap-4">
          <h2 className="text-md font-bold text-gray-700 border-b-2 border-gray-200 pb-1">{groupName}</h2>
          {groupParams.map(param => renderParamCard(param))}
        </div>
      ))}

      {/* Render any added custom questions */}
      {Object.entries(ratings).filter(([k, r]) => r.isCustom).map(([key, r]) => (
          <div key={key} className="flex flex-col gap-3 pb-6 border-b border-gray-100 last:border-0 last:pb-0 relative">
            <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-semibold uppercase">Custom</div>
            <h3 className="text-sm font-semibold text-gray-800 leading-snug pr-16">{r.parameterName}</h3>
            
            <div className="flex gap-2 mt-2">
              <ScoreButton value={10} selectedScore={r.score} label="Excellent" onClick={() => onChange(key, 10, r.remark)} />
              <ScoreButton value={5} selectedScore={r.score} label="Fair" onClick={() => onChange(key, 5, r.remark)} />
              <ScoreButton value={1} selectedScore={r.score} label="Poor" onClick={() => onChange(key, 1, r.remark)} />
              <ScoreButton value={0} selectedScore={r.score} label="Very Poor" onClick={() => onChange(key, 0, r.remark)} />
            </div>

            <div className="mt-2">
              <input 
                type="text" 
                placeholder="Add observation/remark (optional)..." 
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-all placeholder-gray-400"
                value={r.remark}
                onChange={(e) => onChange(key, r.score, e.target.value)}
              />
            </div>
          </div>
      ))}

      <div className="pt-4 flex justify-center">
        <button 
          onClick={onOpenMissing}
          className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Missing Question
        </button>
      </div>
    </div>
  );
};

const ScoreButton = ({ value, selectedScore, label, onClick }) => {
  const isSelected = selectedScore === value;
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 rounded border transition-all ${
        isSelected 
          ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' 
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</span>
    </button>
  );
};

export default ParameterPanel;
