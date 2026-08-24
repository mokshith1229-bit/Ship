import React, { useState, useEffect } from 'react';
import ComparisonKPIs from './ComparisonKPIs';
import CriticalIssueComparison from './CriticalIssueComparison';
import CategoryAssetComparison from './CategoryAssetComparison';
import ChainageIntelligence from './ChainageIntelligence';
import ComparisonMap from './ComparisonMap';
import ManagementSummary from './ManagementSummary';
import { ratingService } from '../../../services/rating.service';
import { processComparisonData } from '../../../utils/comparisonLogic';

const InspectionComparison = ({ selectedProject }) => {
  const [batches, setBatches] = useState([]);
  const [versionA, setVersionA] = useState('');
  const [versionB, setVersionB] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  // Fetch available batches for the selected project
  useEffect(() => {
    if (selectedProject) {
      ratingService.getReadyBatches()
        .then(res => {
          const allBatches = Array.isArray(res) ? res : (res?.data || []);
          const projectBatches = allBatches
            .filter(b => b.project === selectedProject)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setBatches(projectBatches);
          setVersionA('');
          setVersionB('');
          setComparisonData(null);
        })
        .catch(console.error);
    } else {
      setBatches([]);
      setVersionA('');
      setVersionB('');
      setComparisonData(null);
    }
  }, [selectedProject]);

  const flattenTasks = (tasks, batchDate) => {
    const flattened = [];
    tasks.forEach(t => {
      const isSkipped = t.status === 'SKIPPED';
      const ratingList = t.ratings || [];
      
      ratingList.forEach(r => {
        let paramName = r.parameterName || r.parameterKey;
        if (!paramName && r.masterListId && t.parameters) {
          const matchedParam = t.parameters.find(p => p._id === r.masterListId || (p._id && p._id.toString() === r.masterListId.toString()));
          if (matchedParam) {
            paramName = matchedParam.parameter || matchedParam.parameterName;
          }
        }

        flattened.push({
          project: t.project,
          category: t.category || '-',
          assetType: t.assetType || '-',
          parameter: paramName || '-',
          chainage: t.chainage,
          direction: t.direction || '-',
          roadType: t.roadType || '-',
          rating: r.score,
          remark: r.remark,
          skipStatus: isSkipped ? 'Skipped' : 'Completed',
          image: t.image?.cloudinaryUrl || null,
          metadata: t.metadata || null,
          date: batchDate
        });
      });
    });
    return flattened;
  };

  // Fetch tasks and run comparison logic when versions are selected
  useEffect(() => {
    if (versionA && versionB && versionA !== versionB) {
      setLoading(true);
      
      Promise.all([
        ratingService.getBatchTasks(versionA),
        ratingService.getBatchTasks(versionB)
      ])
      .then(([resA, resB]) => {
        const tasksA = Array.isArray(resA) ? resA : (resA?.data || []);
        const tasksB = Array.isArray(resB) ? resB : (resB?.data || []);
        
        const batchAObj = batches.find(b => b._id === versionA);
        const batchBObj = batches.find(b => b._id === versionB);
        
        const dateA = batchAObj ? (batchAObj.createdAt || Date.now()) : Date.now();
        const dateB = batchBObj ? (batchBObj.createdAt || Date.now()) : Date.now();
        
        const flatA = flattenTasks(tasksA, dateA);
        const flatB = flattenTasks(tasksB, dateB);
        
        const data = processComparisonData(flatA, flatB);
        setComparisonData(data);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
    } else {
      setComparisonData(null);
    }
  }, [versionA, versionB]);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 font-medium">Please select a project from the global filters to view comparison.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Comparison Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Project</label>
          <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium cursor-not-allowed">
            {selectedProject}
          </div>
        </div>
        
        <div className="flex items-center justify-center pb-2 px-2 text-gray-400 font-bold uppercase tracking-widest text-sm relative">
          Compare
          {versionA && versionB && versionA !== versionB && (
            <button 
              onClick={() => {
                const a = versionA; const b = versionB;
                setVersionA(''); setVersionB('');
                setTimeout(() => { setVersionA(a); setVersionB(b); }, 50);
              }}
              disabled={loading}
              className="absolute -top-6 text-xs text-blue-500 hover:text-blue-700 whitespace-nowrap bg-blue-50 px-2 py-1 rounded"
              title="Click to fetch the latest ratings from the database"
            >
              Refresh Data
            </button>
          )}
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Version A (Previous)</label>
          <select 
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            value={versionA}
            onChange={(e) => setVersionA(e.target.value)}
          >
            <option value="">Select Batch</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name || new Date(b.createdAt).toLocaleDateString()}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Version B (Current)</label>
          <select 
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            value={versionB}
            onChange={(e) => setVersionB(e.target.value)}
          >
            <option value="">Select Batch</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name || new Date(b.createdAt).toLocaleDateString()}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 font-medium">Fetching and analyzing comparison data...</span>
        </div>
      )}

      {!loading && comparisonData && versionA !== versionB && (
        <div className="flex flex-col gap-8 animate-fade-in">
          <ComparisonKPIs data={comparisonData.kpis} />
          
          <CategoryAssetComparison 
            categories={comparisonData.categories}
            topImprovements={comparisonData.topImprovements}
            topDeteriorations={comparisonData.topDeteriorations}
          />

          <CriticalIssueComparison issues={comparisonData.criticalIssues} />
          
          <ChainageIntelligence chainages={comparisonData.chainages} />
          
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-gray-800 font-bold text-base tracking-wide uppercase">
                 Interactive Comparison Map
               </h2>
             </div>
             <ComparisonMap mapPoints={comparisonData.mapPoints} />
          </div>
          
          <ManagementSummary insights={comparisonData.insights} />
        </div>
      )}
      
      {!loading && (!versionA || !versionB || versionA === versionB) && (
        <div className="flex items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">Select two different versions above to generate the comparison.</p>
        </div>
      )}
    </div>
  );
};

export default InspectionComparison;
