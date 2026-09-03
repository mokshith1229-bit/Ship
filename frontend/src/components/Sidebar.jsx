import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';
import { MdStarRate, MdPerson, MdChevronLeft, MdChevronRight, MdClose, MdDashboard, MdContentCopy, MdCheck, MdNotifications, MdGroup, MdList, MdOutlinePrecisionManufacturing, MdOutlineVideoCameraFront, MdImageSearch, MdVideoLibrary, MdInsights, MdAddRoad, MdConstruction, MdBusiness, MdCameraAlt, MdPhotoLibrary, MdInsertChart } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../services/project.service';
import { ratingService } from '../services/rating.service';

const SidebarHoverButton = ({ isActive, onClick, onDoubleClick, children }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId = null;
    let targetX = 0.5;
    let targetY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;
    let isHovered = false;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const render = () => {
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);

      if (isHovered) {
        btn.style.setProperty('--light-x', `${currentX * 100}%`);
        btn.style.setProperty('--light-y', `${currentY * 100}%`);
      } else {
        targetX = 0.5;
        targetY = 0.5;
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseenter', handleMouseEnter);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseenter', handleMouseEnter);
      btn.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "sidebar-3d-btn relative w-full rounded-[12px] text-sm font-medium transition-all duration-300 border overflow-hidden group outline-none",
        isActive 
          ? "bg-gradient-to-r from-green-500 to-green-400 border-transparent text-white shadow-md shadow-green-500/25 active-btn" 
          : "bg-white border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700 inactive-btn"
      )}
      style={{
        '--light-x': '50%',
        '--light-y': '50%',
      }}
    >
      <style>
        {`
          .sidebar-3d-btn.inactive-btn .glow-layer {
            background: radial-gradient(
              circle 70px at var(--light-x) var(--light-y), 
              rgba(21, 128, 61, 0.15) 0%, 
              rgba(220, 252, 231, 1) 100% 
            );
          }

          .sidebar-3d-btn.active-btn .glow-layer {
            background: radial-gradient(
              circle 70px at var(--light-x) var(--light-y), 
              rgba(20, 83, 45, 0.3) 0%, 
              transparent 100%
            );
          }
        `}
      </style>
      {/* Background layer for the hover glow */}
      <div className="glow-layer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>
      
      {/* Content wrapper to stay above the glow */}
      <div className="relative z-10 flex w-full items-center gap-3.5 px-3 py-3">
        {children}
      </div>
    </button>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProject = searchParams.get('project');
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    const fetchSidebarProjects = async () => {
      try {
        const [allProjectsRes, batches] = await Promise.all([
          projectService.getAllProjects().catch(() => []),
          ratingService.getReadyBatches().catch(() => [])
        ]);
        
        const fetchedProjects = allProjectsRes.data || allProjectsRes || [];
        const projectMap = {};
        
        fetchedProjects.forEach(p => {
          const code = typeof p === 'string' ? p : (p.code || p.name || 'UNKNOWN');
          if (code !== 'UNKNOWN') {
            projectMap[code] = true;
          }
        });
        
        const batchesList = Array.isArray(batches) ? batches : (batches?.data || []);
        batchesList.forEach(batch => {
          if (batch.project) {
            projectMap[batch.project] = true;
          }
        });
        
        const uniqueProjects = Object.keys(projectMap).sort();
        setAllProjects(uniqueProjects);
      } catch (err) {
        console.error('Failed to fetch projects for sidebar', err);
      }
    };
    
    fetchSidebarProjects();
  }, []);

  const projectOptions = useMemo(() => {
    if (!user) return allProjects;
    if (user.role === 'Admin' || user.role === 'Administrator') return allProjects;
    if (user.roadAssignment) {
      return user.roadAssignment
        .split(',')
        .map(p => p.trim().toUpperCase())
        .filter(p => p);
    }
    return [];
  }, [user, allProjects]);

  
  // Sidebar collapsed by default on desktop, but persist user preference
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('hiRateSidebarCollapsed');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem('hiRateSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);
  
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Dropdown menu state (opened on double click)
  const [openMenu, setOpenMenu] = useState(null);
  const sidebarRef = useRef(null);

  // Close openMenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-sidebar', handler);
    return () => window.removeEventListener('toggle-mobile-sidebar', handler);
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: MdDashboard, path: '/dashboard', allowedRoles: ['Admin', 'Administrator', 'HO', 'SPV', 'User'] },
    { name: 'Master List', icon: MdList, path: '/master-list', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Inspection Engine', icon: MdOutlinePrecisionManufacturing, path: '/inspection-engine', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Roadway Sampling', icon: MdAddRoad, path: '/roadway-sampling', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Structure Sampling', icon: MdConstruction, path: '/structure-sampling', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Project Facilities', icon: MdBusiness, path: '/project-facilities', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'ATMS', icon: MdCameraAlt, path: '/atms', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Survey Library', icon: MdVideoLibrary, path: '/survey-library', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Survey Processing', icon: MdOutlineVideoCameraFront, path: '/survey-processing', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Image Review', icon: MdImageSearch, path: '/image-review', allowedRoles: ['Admin', 'Administrator', 'HO'] },
    { name: 'Rating', icon: MdStarRate, path: '/rating', allowedRoles: ['Admin', 'Administrator', 'HO', 'SPV', 'User'] },
    { name: 'Rating V2', icon: MdStarRate, path: '/rating-v2', allowedRoles: ['Admin', 'Administrator', 'HO', 'SPV', 'User'] },
    { name: 'SHIP', icon: MdInsights, path: '/ship', allowedRoles: ['Admin', 'Administrator', 'HO'] },
    { name: 'Reports', icon: MdList, path: '/reports', allowedRoles: ['Admin', 'Administrator', 'HO'] },
    { name: 'Notifications', icon: MdNotifications, path: '/notifications', allowedRoles: ['Admin', 'Administrator', 'HO', 'SPV', 'User'] },
    { name: 'Users', icon: MdGroup, path: '/users', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'User Insights', icon: MdInsertChart, path: '/user-insights', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Role', icon: MdPerson, path: '/role', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Clone Page', icon: MdContentCopy, path: '/demo', allowedRoles: ['Admin', 'Administrator'] },
    { name: 'Profile', icon: MdPerson, path: '/profile', allowedRoles: ['HO', 'SPV', 'User'] },
  ];

  // Helper to get active project from either query param or path
  const getCurrentProject = () => {
    const fromQuery = searchParams.get('project');
    if (fromQuery) return fromQuery.toUpperCase();
    
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'rating') {
      return pathParts[2].toUpperCase();
    }
    return null;
  };

  const activeProject = getCurrentProject();

  const handleNav = (path, proj) => {
    if (proj) {
      if (path === '/rating') navigate(`${path}/${proj}`);
      else navigate(`${path}?project=${proj}`);
    } else {
      // Always navigate to the root of the tab (home page for that tab)
      navigate(path);
    }
    setIsMobileOpen(false); // Close mobile drawer after navigation
  };

  const clickTimeout = useRef(null);
  const [popupTop, setPopupTop] = useState(0);

  const updatePopupPosition = (e) => {
    if (e && e.currentTarget && sidebarRef.current) {
      const btnRect = e.currentTarget.getBoundingClientRect();
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      setPopupTop(btnRect.top - sidebarRect.top);
    }
  };

  const handleSidebarClick = (item, e) => {
    const isDashboard = item.name === 'Dashboard';
    
    if (isDashboard) {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
        updatePopupPosition(e);
        setOpenMenu(item.name);
      } else {
        clickTimeout.current = setTimeout(() => {
          clickTimeout.current = null;
          handleNav(item.path);
          setOpenMenu(null);
        }, 350);
      }
    } else {
      handleNav(item.path);
      setOpenMenu(null);
    }
  };

  const handleSidebarDoubleClick = (item, e) => {
    const isDashboard = item.name === 'Dashboard';
    if (isDashboard) {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      updatePopupPosition(e);
      setOpenMenu(item.name);
    }
  };

  // The actual Sidebar content component to render for both Desktop and Mobile
  const renderSidebarContent = (isMobile) => (
    <div ref={sidebarRef} className={cn(
      "bg-white rounded-[20px] border border-green-500/30 shadow-[0_4px_24px_rgb(0,0,0,0.06)] flex flex-col relative transition-all duration-300",
      isMobile ? "w-64 h-full" : isCollapsed ? "w-[84px] h-[calc(100vh-80px)]" : "w-64 h-[calc(100vh-80px)]"
    )}>
      
      {/* Desktop Expand/Collapse Toggle Button */}
      {!isMobile && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 -right-[20px] w-5 h-10 bg-white border border-green-500/30 border-l-0 rounded-r-full flex items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-500 z-10 transition-colors cursor-pointer -translate-x-px"
        >
          {isCollapsed ? <MdChevronRight className="text-xl -ml-1" /> : <MdChevronLeft className="text-xl -ml-1" />}
        </button>
      )}

      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-end p-4 pb-0">
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-green-600 bg-gray-50 rounded-full"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      )}

      <div className="flex-1 py-6 px-3.5 relative z-50 overflow-y-auto custom-dropdown-scrollbar">
        <ul className="flex flex-col gap-3">
          {menuItems.filter(item => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const isDashboard = item.name === 'Dashboard';
            
            return (
              <li 
                key={item.path} 
                className="relative"
              >
                <SidebarHoverButton
                  onClick={(e) => handleSidebarClick(item, e)}
                  onDoubleClick={(e) => handleSidebarDoubleClick(item, e)}
                  isActive={isActive}
                >
                  <Icon className={cn(
                    "text-[22px] shrink-0 transition-colors duration-300",
                    isActive ? "text-yellow-100" : "text-gray-400 group-hover:text-green-500"
                  )} />
                  
                  <span 
                    className={cn(
                      "whitespace-nowrap transition-all duration-300 overflow-hidden text-left flex-1",
                      !isMobile && isCollapsed ? "opacity-0 w-0 max-w-0" : "opacity-100 w-auto max-w-[200px]"
                    )}
                  >
                    {item.name}
                  </span>
                </SidebarHoverButton>

              </li>
            )
          })}
        </ul>
      </div>

      {/* Double-Click Sub-Menu for Dashboard - Moved outside overflow container to prevent clipping */}
      <AnimatePresence>
        {openMenu === 'Dashboard' && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-[100] w-56 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden",
              isMobile ? "left-12" : "left-[calc(100%+16px)]"
            )}
            style={{ top: `${popupTop}px` }}
          >
            <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100 backdrop-blur-sm flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Project</span>
              <button onClick={() => setOpenMenu(null)} className="text-gray-400 hover:text-gray-600">
                <MdClose className="text-sm" />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-dropdown-scrollbar py-1.5 flex flex-col px-2 gap-1">
              {projectOptions.map(proj => {
                const isSelected = activeProject === proj;
                return (
                  <button 
                    key={proj} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNav('/dashboard', proj);
                      setOpenMenu(null);
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm transition-all duration-200 rounded-md relative group",
                      isSelected 
                        ? "bg-[#5cb85c] text-[#fcefb4] font-medium shadow-sm" 
                        : "text-gray-800 hover:text-green-700 hover:bg-green-50 font-medium"
                    )}
                  >
                    <span className="relative z-10">{proj}</span>
                    {isSelected && <MdCheck className="text-lg text-[#fcefb4]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar wrapper */}
      <motion.div 
        initial={false}
        animate={{ width: isCollapsed ? 100 : 272 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="shrink-0 hidden md:flex items-center justify-center pl-4 pr-1 relative z-[999]"
      >
        {renderSidebarContent(false)}
      </motion.div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative p-4 h-full"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
