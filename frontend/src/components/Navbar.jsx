import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdMenu, MdAccountCircle, MdCloudDownload, MdNotifications } from 'react-icons/md';
import logo from '../assets/editedlogo.PNG';
import logoText from '../assets/HIRATE text.PNG';
import { useAuth } from '../hooks/useAuth';

import CustomDropdown from './common/CustomDropdown';
import RollingLogo from './common/RollingLogo';
import api from '../services/api';
import { projectService } from '../services/project.service';
import { ratingService } from '../services/rating.service';

const Navbar = () => {
  const [project, setProject] = React.useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const [projectOptions, setProjectOptions] = useState([]);
  const { user, logout } = useAuth();
  const isAdmin = user && (user.role === 'Admin' || user.role === 'Administrator' || user.role === 'HO' || user.role === 'SPV');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const [allProjectsRes, batches] = await Promise.all([
          projectService.getAllProjects().catch(() => []),
          ratingService.getReadyBatches().catch(() => [])
        ]);

        const allProjects = allProjectsRes?.data || allProjectsRes || [];
        const projectMap = {};

        allProjects.forEach(p => {
          const code = typeof p === 'string' ? p : (p.code || p.name || 'UNKNOWN');
          if (code !== 'UNKNOWN') {
            projectMap[code] = true;
          }
        });

        const batchesList = Array.isArray(batches) ? batches : (batches?.data || []);
        batchesList.forEach(batch => {
          const pName = batch.project || 'UNKNOWN_BATCH_PROJECT';
          if (pName !== 'UNKNOWN_BATCH_PROJECT') {
            projectMap[pName] = true;
          }
        });

        const options = Object.keys(projectMap).sort().map(code => ({
          label: code,
          value: code
        }));
        setProjectOptions(options);
      } catch (err) {
        console.error('Failed to fetch projects for navbar:', err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'rating') {
      const roadId = pathParts[2].toUpperCase();
      if (projectOptions.some(opt => opt.value === roadId)) {
        setProject(roadId);
      }
    } else {
      setProject('');
    }
  }, [location.pathname, projectOptions]);

  const handleProjectChange = (value) => {
    setProject(value);
    if (value) {
      navigate(`/rating/${value}`);
    }
  };
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const [viewedNotifIds, setViewedNotifIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`viewed_notifs_${user?.id || user?._id || 'user'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`viewed_notifs_${user?.id || user?._id || 'user'}`);
      if (stored) setViewedNotifIds(JSON.parse(stored));
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const isNormalUser = user.role === 'User';
        const endpoint = isNormalUser ? '/work-assignments/my' : '/notifications';
        
        const res = await api.get(endpoint);
        const data = res.data;
        
        if (data.success && Array.isArray(data.data)) {
          if (isNormalUser) {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            const activeAssignments = data.data
              .filter(a => a.status !== 'Completed')
              .map(a => {
                const dueDate = a.dueDate ? new Date(a.dueDate) : null;
                const isOverdue = a.status === 'Overdue' || (dueDate && dueDate < startOfToday);
                const isDueToday = !isOverdue && dueDate && dueDate >= startOfToday && dueDate <= endOfToday;
                const batchId = a.batchId?._id || a.batchId;
                const batchName = a.batchName || a.batchId?.name || 'Inspection Batch';
                const formattedDueDate = dueDate ? dueDate.toLocaleDateString('en-GB') : 'N/A';

                let title = 'New Assignment';
                let type = 'INFO';
                let body = `${a.project || 'Project'} - ${batchName} (Due: ${formattedDueDate})`;

                if (isOverdue) {
                  title = 'Overdue Task';
                  type = 'ERROR';
                  body = `${a.project || 'Project'} - ${batchName} (Overdue since ${formattedDueDate})`;
                } else if (isDueToday) {
                  title = 'Due Today';
                  type = 'WARNING';
                  body = `${a.project || 'Project'} - ${batchName} (Due Today: ${formattedDueDate})`;
                }

                return {
                  _id: a._id,
                  title,
                  type,
                  body,
                  createdAt: a.createdAt || new Date(),
                  link: batchId ? `/rating/inspector/${batchId}` : '/dashboard',
                  isAssignment: true,
                  isOverdue,
                  isDueToday
                };
              });

            // Sort Overdue first, then Due Today, then others
            activeAssignments.sort((a, b) => {
              if (a.isOverdue && !b.isOverdue) return -1;
              if (!a.isOverdue && b.isOverdue) return 1;
              if (a.isDueToday && !b.isDueToday) return -1;
              if (!a.isDueToday && b.isDueToday) return 1;
              return new Date(b.createdAt) - new Date(a.createdAt);
            });

            setNotifications(activeAssignments);
          } else {
            const unread = data.data.filter(n => !n.isRead);
            setNotifications(unread);
          }
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling every minute
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unread badge count calculation
  const unreadCount = notifications.filter(n => !viewedNotifIds.includes(n._id)).length;

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState && notifications.length > 0) {
      // Mark all current notifications as viewed when opened
      const allIds = notifications.map(n => n._id);
      const newViewed = Array.from(new Set([...viewedNotifIds, ...allIds]));
      setViewedNotifIds(newViewed);
      try {
        localStorage.setItem(`viewed_notifs_${user?.id || user?._id || 'user'}`, JSON.stringify(newViewed));
      } catch (e) {}
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      const newViewed = Array.from(new Set([...viewedNotifIds, notif._id]));
      setViewedNotifIds(newViewed);
      try {
        localStorage.setItem(`viewed_notifs_${user?.id || user?._id || 'user'}`, JSON.stringify(newViewed));
      } catch (e) {}

      setShowNotifications(false);
      if (!notif.isAssignment) {
        await api.put(`/notifications/${notif._id}/read`).catch(() => {});
      }
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (e) {
      console.error('Failed to handle notification click', e);
    }
  };

  return (
    <header className="h-[60px] bg-white border-b border-borderColor flex items-center justify-between px-4 shrink-0 relative z-[1000]">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.dispatchEvent(new Event('toggle-mobile-sidebar'))}
          className="p-1 text-gray-600 hover:text-gray-900 focus:outline-none md:hidden"
        >
          <MdMenu className="text-2xl" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="HiRATE Logo" className="w-8 h-8 object-contain" />
          <RollingLogo />
        </div>
        <div className="ml-4 w-[200px]">
          <CustomDropdown
            options={projectOptions}
            value={project}
            onChange={handleProjectChange}
            placeholder="Choose"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={handleToggleNotifications}
            className="relative text-green-800 hover:text-green-700 transition-colors cursor-pointer" 
            title="Notifications"
          >
            <MdNotifications className="text-3xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[2000] overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                ) : (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{notifications.length} Total</span>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-dropdown-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No notifications available.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnviewed = !viewedNotifIds.includes(notif._id);
                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isUnviewed ? 'bg-green-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${
                            notif.isOverdue ? 'text-red-600' : notif.isDueToday ? 'text-amber-600' : 'text-gray-900'
                          }`}>
                            {notif.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{notif.body}</p>
                        
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString('en-GB')} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Notification Footer Link */}
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-xs font-bold text-green-700 hover:text-green-800 hover:underline transition-colors cursor-pointer"
                >
                  View all in Notification Center →
                </button>
              </div>
            </div>
          )}
        </div>
        <button className="text-green-800 hover:text-green-700 transition-colors" title="Download App">
          <MdCloudDownload className="text-3xl" />
        </button>
        
        {/* Profile and Logout */}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            title="Go to Profile"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-gray-800">{user?.name || 'Admin User'}</span>
              <span className="text-xs text-gray-500">{user?.role || 'Administrator'}</span>
            </div>
            <MdAccountCircle className="text-3xl text-green-800" />
          </div>
          
          <button 
            onClick={logout}
            className="ml-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
