import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdMenu, MdAccountCircle, MdCloudDownload, MdNotifications, MdPowerSettingsNew } from 'react-icons/md';
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
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  
  const [focusedItem, setFocusedItem] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const activeRouteItem = location.pathname.includes('/notifications') ? 'notification' : 
                          location.pathname.includes('/download') ? 'download' :
                          location.pathname.includes('/profile') ? 'profile' : null;
  const currentVisibleItem = focusedItem || activeRouteItem;

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
      <div className="flex items-center">
        
        {/* GOOEY CUTOUT HEADER ACTIONS PILL */}
        <div 
          className="flex items-center justify-between bg-[#0B1210] rounded-[36px] px-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] mr-6 relative z-50 h-[48px] w-[220px]"
          onMouseLeave={() => setFocusedItem(null)}
        >
          {/* Shared White Cutout Indicator (Bottom Edge Semi-Circle) */}
          <div 
            className="absolute bottom-0 left-0 w-[52px] h-[26px] bg-white rounded-t-[26px] transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-0"
            style={{
              transform: `translateX(${
                currentVisibleItem === 'notification' ? 8 : 
                currentVisibleItem === 'download' ? 84 : 
                currentVisibleItem === 'profile' ? 160 : 84
              }px) scale(${currentVisibleItem ? 1 : 0.5})`,
              transformOrigin: 'bottom center',
              opacity: currentVisibleItem ? 1 : 0,
              pointerEvents: currentVisibleItem ? 'auto' : 'none'
            }}
          />

          {/* 1. Notification Button */}
          <div 
            className="relative w-[36px] h-[36px] z-10 flex items-center justify-center cursor-pointer" 
            ref={notifRef}
            onMouseEnter={() => setFocusedItem('notification')}
          >
            <button 
              type="button"
              onClick={() => {
                if (notifications.length > 0) {
                  const allIds = notifications.map(n => n._id);
                  const newViewed = Array.from(new Set([...viewedNotifIds, ...allIds]));
                  setViewedNotifIds(newViewed);
                  try {
                    localStorage.setItem(`viewed_notifs_${user?.id || user?._id || 'user'}`, JSON.stringify(newViewed));
                  } catch (e) {}
                }
                navigate('/notifications');
              }}
              className={`relative w-full h-full flex items-center justify-center transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] border-none outline-none rounded-full ${
                currentVisibleItem === 'notification' ? 'text-[#16A05D] drop-shadow-[0_0_6px_rgba(22,160,93,0.7)]' : 'text-white opacity-60 hover:opacity-100'
              }`}
              style={{
                transform: currentVisibleItem === 'notification' ? 'translateY(12px)' : 'translateY(0)'
              }}
              title="Notifications"
              aria-label="Notifications"
            >
              <MdNotifications className="text-[20px]" />
              {unreadCount > 0 && (
                <span className={`absolute top-[-2px] right-[-2px] bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 transition-all duration-[600ms] ${
                  currentVisibleItem === 'notification' ? 'border-white' : 'border-[#0B1210]'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>


          </div>

          {/* 2. Download Button */}
          <div 
            className="relative w-[36px] h-[36px] z-10 flex items-center justify-center cursor-pointer"
            onMouseEnter={() => setFocusedItem('download')}
          >
            <button 
              type="button"
              onClick={() => navigate('/download')}
              className={`relative w-full h-full flex items-center justify-center transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] border-none outline-none rounded-full ${
                currentVisibleItem === 'download' ? 'text-[#16A05D] drop-shadow-[0_0_6px_rgba(22,160,93,0.7)]' : 'text-white opacity-60 hover:opacity-100'
              }`}
              style={{
                transform: currentVisibleItem === 'download' ? 'translateY(12px)' : 'translateY(0)'
              }}
              title="Download"
              aria-label="Download"
            >
              <MdCloudDownload className="text-[20px]" />
            </button>
          </div>

          {/* 3. Profile Button */}
          <div 
            className="relative w-[36px] h-[36px] z-10 flex items-center justify-center cursor-pointer" 
            ref={profileRef}
            onMouseEnter={() => setFocusedItem('profile')}
          >
            <button 
              type="button"
              onClick={() => navigate('/profile')}
              className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] border-none outline-none ${
                currentVisibleItem === 'profile' ? 'text-[#16A05D] drop-shadow-[0_0_6px_rgba(22,160,93,0.7)]' : 'text-white opacity-60 hover:opacity-100'
              }`}
              style={{
                transform: currentVisibleItem === 'profile' ? 'translateY(12px)' : 'translateY(0)'
              }}
              title="Profile"
              aria-label="Profile"
            >
              <MdAccountCircle className="text-[22px]" />
            </button>


          </div>
        </div>

        {/* GLOSSY NEUMORPHIC LOGOUT BUTTON */}
        <button 
          onClick={logout}
          className="relative group w-[40px] h-[40px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-500 cursor-pointer border border-[#222] hover:border-red-400 bg-gradient-to-b from-[#333] via-[#111] to-[#050505] shadow-[0_6px_12px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.15)] hover:from-red-500 hover:via-red-600 hover:to-red-700 hover:shadow-[0_0_25px_rgba(239,68,68,0.8),inset_0_4px_8px_rgba(255,255,255,0.4)] z-50 shrink-0"
          title="Logout"
        >
          {/* Top Glass Highlight */}
          <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/40 to-transparent rounded-full opacity-30 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
          
          {/* Power Icon */}
          <MdPowerSettingsNew className="text-[20px] text-red-500 transition-all duration-500 group-hover:text-white drop-shadow-[0_0_4px_rgba(239,68,68,0.6)] group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,1)] relative z-10" />
        </button>

      </div>
    </header>
  );
};

export default Navbar;
