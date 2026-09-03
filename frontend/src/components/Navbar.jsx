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
          isAdmin ? projectService.getAllProjects().catch(() => []) : Promise.resolve([]),
          ratingService.getReadyBatches().catch(() => [])
        ]);

        const allProjects = allProjectsRes.data || allProjectsRes || [];
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
  }, [isAdmin]);

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
            const activeAssignments = data.data
              .filter(a => a.status === 'Assigned' || a.status === 'In Progress')
              .map(a => ({
                _id: a._id,
                title: 'New Assignment',
                type: 'INFO',
                body: `${a.project} - ${a.batchName || 'Batch'} (Due: ${new Date(a.dueDate).toLocaleDateString()})`,
                createdAt: a.createdAt,
                link: `/rating/inspector/${a.batchId?._id || a.batchId}`,
                isAssignment: true
              }));
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
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-green-800 hover:text-green-700 transition-colors" 
            title="Notifications"
          >
            <MdNotifications className="text-3xl" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[2000] overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{notifications.length} New</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-dropdown-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif._id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 text-sm">{notif.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          notif.type === 'SUCCESS' ? 'bg-green-100 text-green-800 border-green-200' :
                          notif.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          notif.type === 'ERROR' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-blue-100 text-blue-800 border-blue-200'
                        } border`}>
                          {notif.type || 'INFO'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{notif.body}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              try {
                                if (notif.isAssignment) {
                                  setShowNotifications(false);
                                  navigate(notif.link);
                                } else {
                                  await api.put(`/notifications/${notif._id}/read`);
                                  setNotifications(prev => prev.filter(n => n._id !== notif._id));
                                  if (notif.link) {
                                    setShowNotifications(false);
                                    navigate(notif.link);
                                  }
                                }
                              } catch (e) {
                                console.error('Failed to handle notification click', e);
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                          >
                            {notif.link ? 'View' : 'Mark Read'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
