import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDashboard, MdBusiness, MdTimeline, MdWarning, MdInsights } from 'react-icons/md';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ExecutiveOverview from '../../components/Ship/ExecutiveOverview';
import ProjectIntelligence from '../../components/Ship/ProjectIntelligence';
import { shipService } from '../../services/ship.service';
import { useAuth } from '../../hooks/useAuth';

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: MdDashboard },
  { id: 'projects', label: 'Project Intelligence', icon: MdBusiness },
  { id: 'assets', label: 'Asset Intelligence', icon: MdTimeline },
  { id: 'risks', label: 'Risk Intelligence', icon: MdWarning },
  { id: 'insights', label: 'Dynamic Insights', icon: MdInsights },
];

const ShipDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState(null);
  const [projectsData, setProjectsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' && !overviewData) {
        const data = await shipService.getOverview();
        setOverviewData(data);
      } else if (activeTab === 'projects' && !projectsData) {
        const data = await shipService.getProjects();
        setProjectsData(data);
      }
      // other tabs would fetch here in Phase 2
    } catch (err) {
      console.error('Failed to fetch SHIP data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      <Navbar user={user} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">SHIP</span>
              <span className="text-gray-300 text-3xl font-light">|</span>
              <span className="text-2xl text-gray-600 font-medium tracking-normal mt-1">Intelligence Platform</span>
            </h1>
            <p className="text-gray-500 mt-2">Executive analytics and dynamic insights.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit mb-8 border border-gray-200 backdrop-blur-md">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                    isActive ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="shipTabIndicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="relative min-h-[400px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-10 rounded-2xl">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExecutiveOverview data={overviewData} />
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProjectIntelligence projects={projectsData} />
                </motion.div>
              )}

              {['assets', 'risks', 'insights'].includes(activeTab) && (
                <motion.div
                  key="coming-soon"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[400px]"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-gray-400">P2</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Module Under Construction</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                      This intelligence view is being actively developed and will be available shortly.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShipDashboard;
