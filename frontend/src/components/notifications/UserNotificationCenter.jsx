import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdNotificationsActive,
  MdDoneAll,
  MdSearch,
  MdPlayArrow,
  MdWarning,
  MdCheckCircle,
  MdChevronRight,
  MdErrorOutline
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserNotificationCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`read_overdue_notifs_${user?.id || 'user'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real MongoDB WorkAssignments for the logged-in user
  const fetchUserData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const assignRes = await api.get('/work-assignments/my').catch(() => ({ data: { data: [] } }));
      const assignmentData = assignRes.data?.data || [];
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (err) {
      console.error("Failed to load user overdue notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Format Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Convert WorkAssignments into STRICTLY Overdue notifications (matching Dashboard Overdue logic)
  const notificationItems = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const items = [];

    assignments.forEach((a) => {
      const dueDate = a.dueDate ? new Date(a.dueDate) : null;
      const isCompleted = a.status === 'Completed';
      if (isCompleted) return; // Completed tasks are excluded

      // Check strictly for Overdue status (matching dashboard)
      const isOverdue =
        a.status === 'Overdue' ||
        (dueDate && dueDate < startOfToday);

      if (isOverdue) {
        const diffMs = dueDate ? Math.max(0, startOfToday.getTime() - dueDate.getTime()) : 0;
        const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const batchId = a.batchId?._id || a.batchId;
        const batchName = a.batchName || a.batchId?.name || 'Inspection Batch';
        const assignedByName = a.assignedBy?.name || 'Administrator';
        const category = a.category || 'Roadway';
        const project = a.project || 'Highway Project';
        const pages = a.pages || 'All Pages';

        items.push({
          id: `overdue-${a._id}`,
          assignmentId: a._id,
          batchId,
          type: 'overdue',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          dotColor: 'bg-rose-500',
          indicator: '🔴',
          title: 'Overdue Task',
          heading: `${category} Inspection - ${project}`,
          description: `${batchName} • ${pages}`,
          statusText: `Due date crossed by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
          assignedBy: assignedByName,
          dueDate: a.dueDate,
          createdAt: a.createdAt,
          isCompleted: false,
          isOverdue: true,
          actionLabel: 'Start Rating'
        });
      }
    });

    // Sort by oldest due date first (highest urgency)
    return items.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  }, [assignments]);

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all').catch(() => {});
      const allIds = notificationItems.map(n => n.id);
      setReadIds(allIds);
      localStorage.setItem(`read_overdue_notifs_${user?.id || 'user'}`, JSON.stringify(allIds));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Mark Single Read
  const handleMarkSingleRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem(`read_overdue_notifs_${user?.id || 'user'}`, JSON.stringify(updated));
    }
  };

  // Handle Clear All
  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear-all').catch(() => {});
      const allIds = notificationItems.map(n => n.id);
      setReadIds(allIds);
      localStorage.setItem(`read_overdue_notifs_${user?.id || 'user'}`, JSON.stringify(allIds));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notificationItems.filter((item) => {
      const isRead = readIds.includes(item.id);

      // Search match
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.heading?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.title?.toLowerCase().includes(q) ||
          item.assignedBy?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Tab filter
      if (activeTab === 'unread') return !isRead;

      return true; // 'all'
    });
  }, [notificationItems, activeTab, searchQuery, readIds]);

  const unreadCount = notificationItems.filter(item => !readIds.includes(item.id)).length;
  const overdueCount = notificationItems.length;

  if (loading) {
    return (
      <div className="p-12 flex flex-col justify-center items-center h-96 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent"></div>
        <p className="text-gray-500 text-sm font-medium">Loading your overdue notifications...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* ─── Header Card ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shadow-inner shrink-0">
              <MdNotificationsActive />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notification Center</h1>
                {overdueCount > 0 && (
                  <span className="bg-rose-500 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                    {overdueCount} Overdue
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="bg-amber-500 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-0.5 font-medium">
                Overdue task alerts and deadlines for <span className="font-bold text-gray-700">{user?.name || 'your account'}</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <MdDoneAll className="text-base" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Overdue KPI Card ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'all'
              ? 'bg-rose-50/80 border-rose-300 shadow-sm ring-1 ring-rose-400'
              : 'bg-white border-gray-200 hover:border-rose-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0">
              <MdWarning />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Overdue Tasks</span>
              <span className="text-2xl font-black text-rose-700">{overdueCount}</span>
            </div>
          </div>
          <span className="text-xl">🔴</span>
        </div>

        <div
          onClick={() => setActiveTab('unread')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'unread'
              ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-400'
              : 'bg-white border-gray-200 hover:border-amber-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
              <MdErrorOutline />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Unread Alerts</span>
              <span className="text-2xl font-black text-amber-700">{unreadCount}</span>
            </div>
          </div>
          <span className="text-xl">⚠️</span>
        </div>
      </div>

      {/* ─── Main Notification Stream Card ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[460px]">
        {/* Search and Tabs Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `🔴 Overdue (${overdueCount})` },
              { id: 'unread', label: `⚠️ Unread (${unreadCount})` }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              placeholder="Search overdue tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all font-medium text-gray-800"
            />
          </div>
        </div>

        {/* Overdue Notification List */}
        <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
                <MdCheckCircle />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                {searchQuery || activeTab !== 'all' ? 'No matching overdue records' : 'No Overdue Tasks!'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                {searchQuery || activeTab !== 'all'
                  ? 'Try selecting a different filter tab or clearing your search term.'
                  : 'All your assigned inspections are currently on schedule. Any overdue tasks will appear here automatically.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isRead = readIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkSingleRead(item.id)}
                  className={`p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    !isRead
                      ? 'bg-rose-50/15 hover:bg-rose-50/30 border-l-4 border-l-rose-500'
                      : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Left Side: Indicator, Overdue Title, Project & Deadline Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <span className="text-lg mt-0.5 shrink-0 select-none">{item.indicator}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor}`}>
                          {item.title}
                        </span>
                        {!isRead && (
                          <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded-full">
                            NEW
                          </span>
                        )}
                        <span className="text-[11px] text-rose-600 font-semibold">
                          {item.statusText}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-rose-700 transition-colors">
                        {item.heading}
                      </h3>

                      <p className="text-xs font-semibold text-gray-600 mt-0.5">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1.5 flex-wrap">
                        {item.dueDate && (
                          <span>
                            Due Date: <strong className="text-rose-700 font-bold">{formatDate(item.dueDate)}</strong>
                          </span>
                        )}
                        {item.assignedBy && (
                          <span>
                            • Assigned by: <strong className="text-gray-700">{item.assignedBy}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Start Rating Action Button */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {item.batchId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSingleRead(item.id);
                          const queryParams = new URLSearchParams();
                          if (item.assignmentId || item.id) queryParams.set('assignmentId', item.assignmentId || item.id);
                          if (item.category) queryParams.set('category', item.category);
                          if (item.pages) queryParams.set('pages', item.pages);
                          navigate(`/rating/inspector/${item.batchId}?${queryParams.toString()}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MdPlayArrow className="text-base" />
                        <span>{item.actionLabel}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSingleRead(item.id);
                          navigate('/dashboard');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <span>View</span>
                        <MdChevronRight />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotificationCenter;
