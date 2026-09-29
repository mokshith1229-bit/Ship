import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../../services/dashboard.service';
import NetworkConditionSnapshot from './NetworkConditionSnapshot';
import RatingProfile from './RatingProfile';
import ConditionSummary from './ConditionSummary';
import AssetHealthRegister from './AssetHealthRegister';
import IssueBreakdown from './IssueBreakdown';
import ChainageHotspots from './ChainageHotspots';
import RoadChainageHealth from './RoadChainageHealth';
import InspectionCompleteness from './InspectionCompleteness';
import KeyFindings from './KeyFindings';
import { motion } from 'framer-motion';

const AdvancedAnalytics = ({ selectedProject }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    if (!selectedProject) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = {};
        if (selectedAssetType) filters.assetType = selectedAssetType;
        if (selectedIssue) filters.issue = selectedIssue;
        
        const result = await dashboardService.getAdvancedAnalytics(selectedProject, filters);
        setData(result);
      } catch (err) {
        console.error('Failed to fetch advanced analytics:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProject, selectedAssetType, selectedIssue]);

  if (!selectedProject) return null;

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
        Loading Network Intelligence...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500 font-medium">
        {error}
      </div>
    );
  }

  const handleClearFilters = () => {
    setSelectedAssetType(null);
    setSelectedIssue(null);
  };

  const totalAudits = data.inspectionCoverage?.totalAudits || 0;

  return (
    <div className="flex flex-col mb-6 font-sans">
      
      {/* Filters indicator */}
      {(selectedAssetType || selectedIssue) && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">Active Filters:</span>
            {selectedAssetType && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                Asset: {selectedAssetType}
              </span>
            )}
            {selectedIssue && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                Issue: {selectedIssue}
              </span>
            )}
          </div>
          <button 
            onClick={handleClearFilters}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 uppercase tracking-wide px-3 py-1 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* A. NETWORK CONDITION SNAPSHOT (Full Width) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <NetworkConditionSnapshot healthData={data.projectHealth} coverageData={data.inspectionCoverage} />
      </motion.div>

      {/* Grid Layout for B and C */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* B. RATING PROFILE (8 columns) */}
        <motion.div className="col-span-12 xl:col-span-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <RatingProfile data={data.ratingProfile} totalAudits={totalAudits} />
        </motion.div>
        
        {/* C. CONDITION SUMMARY (4 columns) */}
        <motion.div className="col-span-12 xl:col-span-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ConditionSummary data={data.conditionDistribution} totalAudits={totalAudits} />
        </motion.div>
      </div>

      {/* D. ASSET HEALTH REGISTER (Full Width) */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <AssetHealthRegister 
          data={data.assetPerformance} 
          selectedAssetType={selectedAssetType}
          onSelectAssetType={setSelectedAssetType}
        />
      </motion.div>

      {/* Grid Layout for E and F */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* E. ISSUE BREAKDOWN (6 columns) */}
        <motion.div className="col-span-12 xl:col-span-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <IssueBreakdown 
            data={data.issueIntelligence} 
            selectedIssue={selectedIssue}
            onSelectIssue={setSelectedIssue}
          />
        </motion.div>
        
        {/* F. CHAINAGE HOTSPOTS (6 columns) */}
        <motion.div className="col-span-12 xl:col-span-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <ChainageHotspots data={data.criticalLocations} />
        </motion.div>
      </div>

      {/* G. ROAD / CHAINAGE HEALTH (Full Width) */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <RoadChainageHealth data={data.roadChainageHealth} />
      </motion.div>

      {/* Grid Layout for H and I */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* H. INSPECTION COMPLETENESS (6 columns) */}
        <motion.div className="col-span-12 xl:col-span-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <InspectionCompleteness data={data.inspectionCoverage} />
        </motion.div>
        
        {/* I. KEY FINDINGS (6 columns) */}
        <motion.div className="col-span-12 xl:col-span-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <KeyFindings data={data.keyFindings} />
        </motion.div>
      </div>

    </div>
  );
};

export default AdvancedAnalytics;
