import React, { useState, useEffect, useMemo } from 'react';
import HiRateRoadLoader from '../common/HiRateRoadLoader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MdAssignment,
  MdPendingActions,
  MdCheckCircle,
  MdWarning,
  MdAccessTime,
  MdPlayArrow,
  MdRefresh,
  MdSearch
} from 'react-icons/md';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
        <Icon className="text-xl text-gray-600" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-800 leading-tight mt-0.5">{value}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch consolidated user dashboard from API
      try {
        const dashData = await dashboardService.getUserDashboard();
        if (dashData) {
          setKpis(dashData.kpis || {});
          setAssignments(dashData.assignments || []); 
          return;
        }
      } catch (err) {
        console.warn('Direct user dashboard endpoint failed, falling back to separate calls:', err);
      }

      // Fallback to separate endpoints
      const [kpiData, assignRes] = await Promise.all([
        dashboardService.getUserKPIs().catch(() => null),
        api.get('/work-assignments/my').catch(() => ({ data: { data: [] } }))
      ]);

      if (kpiData) setKpis(kpiData);
      if (assignRes.data?.data) {
        setAssignments(assignRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load user dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return assignments.filter((item) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        item.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status tab filter
      if (statusFilter === 'Active') {
        return item.status === 'Assigned' || item.status === 'In Progress';
      }
      if (statusFilter === 'Assigned') {
        return item.status === 'Assigned';
      }
      if (statusFilter === 'In Progress') {
        return item.status === 'In Progress';
      }
      if (statusFilter === 'Overdue') {
        return (
          item.status === 'Overdue' ||
          (item.status !== 'Completed' &&
            item.dueDate &&
            new Date(item.dueDate) < startOfToday)                                 
        );
      }
      if (statusFilter === 'Completed') {
        return item.status === 'Completed';
      }
      return true; // 'All'
    });
  }, [assignments, statusFilter, searchQuery]);

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><HiRateRoadLoader size="medium" /></div>;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const fallbackOverdue = assignments.filter(
    (a) => a.status === 'Overdue' || (a.status !== 'Completed' && a.dueDate && new Date(a.dueDate) < startOfToday)
  ).length;

  const fallbackDueToday = assignments.filter(
    (a) => a.status !== 'Completed' && a.status !== 'Overdue' && a.dueDate && new Date(a.dueDate) >= startOfToday && new Date(a.dueDate) <= endOfToday
  ).length;

  const activeCount = assignments.filter(
    (a) => a.status === 'Assigned' || a.status === 'In Progress'
  ).length;

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-2">
      {/* ─── Greeting Section ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-semibold mb-2 border border-white/20">
            <span>Inspector Workspace</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.name || 'Inspector'}! 👋
          </h1>
          <p className="text-green-100 text-sm mt-1 max-w-xl">
            Here is what you need to do today. Review your assigned inspections, complete ratings, and track deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 active:bg-white/40 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-sm transition-all border border-white/20 shadow-sm cursor-pointer"
            title="Refresh dashboard data"
          >
            <MdRefresh className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─── Assignment KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total" 
          value={kpis?.totalAssignments ?? assignments.length}
          icon={MdAssignment}
        />
        <StatCard
          title="New / Pending"
          value={kpis?.newAssignments ?? kpis?.pendingAssignments ?? assignments.filter((a) => a.status === 'Assigned').length}
          icon={MdAssignment}
        />
        <StatCard
          title="In Progress"
          value={kpis?.inProgress ?? assignments.filter((a) => a.status === 'In Progress').length}
          icon={MdPendingActions}
        />
        <StatCard
          title="Due Today"
          value={kpis?.dueToday ?? fallbackDueToday}
          icon={MdAccessTime}
        />
        <StatCard
          title="Overdue"
          value={kpis?.overdue ?? fallbackOverdue}
          icon={MdWarning}
        />
        <StatCard
          title="Completed"
          value={kpis?.completedToday ?? assignments.filter((a) => a.status === 'Completed').length}
          icon={MdCheckCircle}
        />
      </div>

      {/* ─── Main Content: My Assignments (Full Width) ────────────────────── */}
      <div className="w-full flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                <MdAssignment className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-800">My Assignments</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                    {activeCount} Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  List of inspections assigned to you
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                placeholder="Search project or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-medium text-gray-800"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 overflow-x-auto custom-scrollbar">
            {['Active', 'All', 'Assigned', 'In Progress', 'Overdue', 'Completed'].map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Assignments Table */}
          <div className="overflow-x-auto">
            {filteredAssignments.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <MdAssignment className="text-4xl mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">No assignments found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? 'Try adjusting your search criteria' : 'You currently have no assignments in this category'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 pl-6 font-bold">Project</th>
                    <th className="p-4 font-bold">Batch / Category</th>
                    <th className="p-4 font-bold">Pages</th>
                    <th className="p-4 font-bold">Due Date</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 pr-6 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => {
                    const dueDateObj = assignment.dueDate ? new Date(assignment.dueDate) : null;
                    const isCompleted = assignment.status === 'Completed';

                    const isOverdue =
                      assignment.status === 'Overdue' ||
                      (!isCompleted && dueDateObj && dueDateObj < startOfToday);

                    const isDueToday =
                      !isCompleted &&
                      !isOverdue &&
                      dueDateObj &&
                      dueDateObj >= startOfToday &&
                      dueDateObj <= endOfToday;

                    const batchIdValue =
                      assignment.batchId?._id || assignment.batchId;

                    const priorityColor =
                      assignment.priority === 'High'
                        ? 'text-red-600 bg-red-50 border-red-200'
                        : assignment.priority === 'Low'
                        ? 'text-blue-600 bg-blue-50 border-blue-200'
                        : 'text-amber-600 bg-amber-50 border-amber-200';

                    return (
                      <tr
                        key={assignment._id}
                        
                        
                        
                    
              
                        
                          className="hover:bg-gray-50/80 transition-colors"

                      >
                        <td className="p-4 pl-6">
                          <div className="font-bold text-gray-900 text-sm">
                            {assignment.project}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColor}`}
                            >
                              {assignment.priority || 'Medium'} Priority
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-semibold text-gray-800">
                            {assignment.batchName ||
                              assignment.batchId?.name ||
                              'Inspection Batch'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {assignment.category || 'Roadway'}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-gray-700">
                          {assignment.pages || 'All'}
                        </td>
                        <td className="p-4">
                          <div
                            className={`text-xs font-bold ${
                              isOverdue
                                ? 'text-red-600'
                                : isDueToday
                                ? 'text-orange-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {assignment.dueDate
                              ? new Date(assignment.dueDate).toLocaleDateString('en-GB')
                              : 'N/A'}
                          </div>
                          {isOverdue && !isCompleted && (
                            <span className="text-[10px] text-red-500 font-bold block mt-0.5">
                              Overdue
                            </span>
                          )}
                          {isDueToday && (
                            <span className="text-[10px] text-orange-500 font-bold block mt-0.5">
                              Due Today
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                              assignment.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : assignment.status === 'Assigned'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : assignment.status === 'Completed'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => {
                              const queryParams = new URLSearchParams();
                              if (assignment._id || assignment.id) queryParams.set('assignmentId', assignment._id || assignment.id);
                              if (assignment.category) queryParams.set('category', assignment.category);
                              if (assignment.pages) queryParams.set('pages', assignment.pages);
                              navigate(`/rating/inspector/${batchIdValue}?${queryParams.toString()}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <MdPlayArrow className="text-base" />
                            <span>Start Rating</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
