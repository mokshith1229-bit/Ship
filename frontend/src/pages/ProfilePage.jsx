import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth'; 
import { 
  MdPerson, MdBadge, MdEmail, MdBusiness, MdPhone, MdWork, 
  MdHistory, MdDevices, MdSecurity, MdLockOutline, MdArrowBack,
  MdEdit
} from 'react-icons/md';
import bannerBg from '../assets/banner_bg.png';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user && (user.role === 'Admin' || user.role === 'Administrator' || user.role === 'HO' || user.role === 'SPV');

  // Format last login dynamically
  const formatLastLogin = (dateVal) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const datePart = validDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = validDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  };

  const formatLastLoginShort = (dateVal) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const datePart = validDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = validDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} ${timePart}`;
  };

  // User accounts: display strictly login information
  const userActivities = [
    {
      dateLabel: 'Today',
      title: 'Logged In',
      subtitle: `Successful login (${formatLastLogin(user?.lastLogin)})`,
      timeAgo: 'Just now'
    },
    {
      dateLabel: 'Yesterday',
      title: 'Logged In',
      subtitle: 'Successful login (Session authenticated)',
      timeAgo: '1 day ago'
    },
    {
      dateLabel: 'Earlier',
      title: 'Logged In',
      subtitle: 'Successful login via Windows Chrome',
      timeAgo: '2 days ago'
    }
  ];

  // Admin accounts: display full administrative activities
  const adminActivities = [
    {
      dateLabel: 'Today',
      title: 'Updated User Permission',
      subtitle: 'Role Management',
      timeAgo: '10 mins ago'
    },
    {
      dateLabel: 'Yesterday',
      title: 'Created New Project',
      subtitle: 'Project: HIRATE Enhancement',
      timeAgo: '1 day ago'
    },
    {
      dateLabel: '05 Aug 2026',
      title: 'Updated Master List',
      subtitle: 'Rating Categories',
      timeAgo: '2 days ago'
    },
    {
      dateLabel: '04 Aug 2026',
      title: 'Logged In',
      subtitle: 'Successful login',
      timeAgo: '3 days ago'
    }
  ];

  const recentActivities = isAdmin ? adminActivities : userActivities;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200 shadow-sm transition-all"
              >
                <MdArrowBack className="text-xl" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm font-medium text-gray-500 mt-0.5">Manage your account settings and preferences</p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 bg-white border border-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors shadow-sm">
              <MdEdit className="text-base" />
              Edit Profile
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] min-h-0 pb-4">
            
            {/* Left Column: Profile Card */}
            <div className="w-full lg:w-[30%] flex-shrink-0 flex flex-col h-full min-h-0">
              <div 
                className="rounded-[20px] shadow-sm relative overflow-hidden h-full flex flex-col"
                style={{
                  backgroundImage: `url(${bannerBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Top content (centered) */}
                <div className="flex flex-col items-center pt-8 px-4 z-10 flex-1">
                  
                  {/* Profile Avatar with double ring */}
                  <div className="relative mb-4 mt-2">
                    <div className="absolute inset-0 bg-white/30 rounded-full scale-125"></div>
                    <div className="relative w-[90px] h-[90px] bg-white rounded-full flex items-center justify-center text-[#0a4d29] text-[50px] shadow-sm z-10">
                      <MdPerson />
                    </div>
                  </div>
                  
                  <h2 className="text-[19px] font-extrabold uppercase tracking-wide text-gray-900 mt-2">
                    {user?.name || 'System Admin'}
                  </h2>
                  <p className="text-gray-600 font-medium text-[13px] mt-1 mb-3">
                    {user?.role || 'Admin'}
                  </p>
                  
                  <div className="bg-[#16A05D]/20 text-[#0a4d29] px-4 py-1.5 rounded-full flex items-center gap-2 mb-5 font-bold text-xs">
                    <div className="w-2 h-2 bg-[#16A05D] rounded-full"></div>
                    Active
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <MdHistory className="text-white text-lg" />
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-white uppercase font-bold tracking-wider leading-tight">Last Login</span>
                      <span className="text-[12px] font-bold text-white">{formatLastLoginShort(user?.lastLogin)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Text */}
                <div className="p-6 z-10 mt-auto pb-6">
                  <h3 className="text-black text-lg font-bold leading-snug">
                    Building <br />
                    Safer Roads <br />
                    for a Stronger <br />
                    Tomorrow
                  </h3>
                  <div className="w-8 h-1 bg-[#16A05D] mt-3 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0 h-full">
              
              {/* Personal Information */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 shrink-0">
                <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Personal Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdPerson className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 mb-0.5">Full Name</p>
                      <p className="text-[13px] font-bold text-gray-800">{user?.name || 'System Admin'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdBadge className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 mb-0.5">Employee ID</p>
                      <p className="text-[13px] font-bold text-gray-800">EMP-1024</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdEmail className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 mb-0.5">Email Address</p>
                      <p className="text-[13px] font-bold text-gray-800">{user?.email || 'admin@hirate.in'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdBusiness className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 mb-0.5">Department</p>
                      <p className="text-[13px] font-bold text-gray-800">Operations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdPhone className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 mb-0.5">Mobile Number</p>
                      <p className="text-[13px] font-bold text-gray-800">{user?.mobile || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdWork className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 mb-0.5">Designation</p>
                      <p className="text-[13px] font-bold text-gray-800">{user?.designation || user?.role || 'System Administrator'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Account Security & Recent Activity */}
              <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
                
                {/* Account Security */}
                <div className="w-full md:w-[45%] bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <MdSecurity className="text-green-600 text-lg" />
                    <h3 className="text-sm font-bold text-gray-800">Account Security</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3.5 flex-1 overflow-y-auto custom-dropdown-scrollbar pr-2">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                          <MdHistory className="text-sm" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Last Login</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-800">{formatLastLogin(user?.lastLogin)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                          <MdDevices className="text-sm" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Login Device</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-800">Windows Chrome</span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                          <MdSecurity className="text-sm" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Account Status</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-[11px] font-bold text-green-600">Active</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                          <MdLockOutline className="text-sm" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Password</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">Last changed 30 days ago</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-3 flex items-center justify-center gap-2 border border-green-200 text-green-600 hover:bg-green-50 py-2 rounded-xl font-bold text-xs transition-colors shrink-0">
                    <MdLockOutline className="text-base" />
                    Change Password
                  </button>
                </div>

                {/* Recent Activity */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <MdHistory className="text-green-600 text-lg" />
                      <h3 className="text-sm font-bold text-gray-800">Recent Activity</h3>
                    </div>
                    <button className="text-[11px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                      View All <span>&rsaquo;</span>
                    </button>
                  </div>
                  
                  <div className="relative pl-3 space-y-5 flex-1 overflow-y-auto custom-dropdown-scrollbar pr-2 pb-2">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100 z-0"></div>
                    
                    {recentActivities.map((act, index) => (
                      <div key={index} className="relative z-10 flex items-start gap-6">
                        <div className="flex items-center gap-3 w-24 shrink-0 pt-0.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full outline outline-[3px] outline-white"></div>
                          <span className="text-[10px] font-bold text-green-600 leading-tight">{act.dateLabel}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[11px] font-bold text-gray-800 leading-tight">{act.title}</h4>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5 leading-tight">{act.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap pt-0.5">{act.timeAgo}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
