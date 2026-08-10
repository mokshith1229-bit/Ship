import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { reportsService } from '../services/reports.service';
import SPVListPanel from './Reports/SPVListPanel';
import SPVAnalyticsWorkspace from './Reports/SPVAnalyticsWorkspace';
import { LuLoader } from 'react-icons/lu';
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion';

const ReportsPage = () => {
  const [spvs, setSpvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpvId, setSelectedSpvId] = useState(null);
  const [transitioningSpvId, setTransitioningSpvId] = useState(null);
  const [spvAnalytics, setSpvAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectSpv = (id) => {
    if (id === selectedSpvId) return;
    setTransitioningSpvId(id);
    setTimeout(() => {
      setSelectedSpvId(id);
      setTransitioningSpvId(null);
    }, 150);
  };

  useEffect(() => {
    fetchSPVs();
  }, []);

  const fetchSPVs = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getSPVLeaderboard();
      const spvList = (res.data || []).sort((a, b) => a.name.localeCompare(b.name));
      setSpvs(spvList);
      if (spvList.length > 0) {
        setSelectedSpvId(spvList[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch SPV Leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSpvId) {
      fetchAnalytics(selectedSpvId);
    }
  }, [selectedSpvId]);

  const fetchAnalytics = async (spvId) => {
    try {
      setAnalyticsLoading(true);
      const res = await reportsService.getSPVAnalytics(spvId);
      setSpvAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch SPV Analytics', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const filteredSpvs = spvs.filter(spv => 
    spv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (spv.manager && spv.manager.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <LayoutGroup>
      <div className="flex h-screen bg-[#F8FAFC] font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Navbar />
          <main className="flex-1 overflow-hidden p-[10px] flex gap-[10px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <LuLoader className="animate-spin text-3xl text-green-600" />
              </div>
            ) : (
              <>
                {/* LEFT PANEL */}
                <div className="w-[30%] min-w-[320px] max-w-[400px] bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
                  <SPVListPanel 
                    spvs={filteredSpvs} 
                    selectedSpvId={selectedSpvId} 
                    transitioningSpvId={transitioningSpvId}
                    onSelect={handleSelectSpv} 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col overflow-hidden min-w-0">
                  {spvs.find(s => s._id === selectedSpvId) ? (
                    <SPVAnalyticsWorkspace 
                      key={selectedSpvId} 
                      baseSpv={spvs.find(s => s._id === selectedSpvId)}
                      data={spvAnalytics}
                      loading={analyticsLoading}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Select an SPV to view analytics
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </LayoutGroup>
  );
};

export default ReportsPage;
