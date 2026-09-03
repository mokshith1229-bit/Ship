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

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-900 rounded-2xl shadow-md p-8 text-white flex flex-col items-center relative overflow-hidden h-full min-h-[340px]">
                {/* Decorative background circles */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
                
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-green-700 text-6xl shadow-xl z-10 mb-6">
                  <MdPerson />
                </div>
                
                <h2 className="text-2xl font-bold uppercase tracking-wide z-10">{user?.name || 'SRAVYA'}</h2>
                <p className="text-green-100 font-medium text-sm mt-1 mb-8 z-10">{user?.role || 'Admin'}</p>
                
                <div className="flex items-center gap-6 mt-auto z-10 w-full justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    <span className="text-sm font-bold text-white">Active</span>
                  </div>
                  <div className="w-px h-4 bg-green-500/50"></div>
                  <div className="flex items-center gap-2">
                    <MdHistory className="text-green-200" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-green-200 uppercase font-bold tracking-wider leading-tight">Last Login</span>
                      <span className="text-xs font-semibold text-white">07 Aug 2026 10:25 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Personal Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-full">
                <h3 className="text-base font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdPerson className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">Full Name</p>
                      <p className="text-sm font-bold text-gray-800">{user?.name || 'SRAVYA'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdBadge className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">Employee ID</p>
                      <p className="text-sm font-bold text-gray-800">EMP-1024</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdEmail className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">Email Address</p>
                      <p className="text-sm font-bold text-gray-800">{user?.email || 'sravya@hirate.in'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdBusiness className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">Department</p>
                      <p className="text-sm font-bold text-gray-800">Operations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdPhone className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">Mobile Number</p>
                      <p className="text-sm font-bold text-gray-800">{user?.mobile || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MdWork className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">Designation</p>
                      <p className="text-sm font-bold text-gray-800">{user?.designation || user?.role || 'Admin'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Left: Account Security */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <MdSecurity className="text-green-600 text-xl" />
                  <h3 className="text-base font-bold text-gray-800">Account Security</h3>
                </div>
                
                <div className="flex flex-col gap-5 flex-1">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <MdHistory />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Last Login</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">07 Aug 2026, 10:25 AM</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <MdDevices />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Login Device</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">Windows Chrome</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <MdSecurity />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Account Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-bold text-green-600">Active</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <MdLockOutline />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Password</span>
                    </div>
                    <span className="text-sm font-bold text-gray-500">Last changed 30 days ago</span>
                  </div>
                </div>
                
                <button className="w-full mt-4 flex items-center justify-center gap-2 border border-green-200 text-green-600 hover:bg-green-50 py-3 rounded-xl font-bold text-sm transition-colors">
                  <MdLockOutline className="text-lg" />
                  Change Password
                </button>
              </div>
            </div>

            {/* Bottom Right: Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <MdHistory className="text-green-600 text-xl" />
                    <h3 className="text-base font-bold text-gray-800">Recent Activity</h3>
                  </div>
                  <button className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                    View All <span>&rsaquo;</span>
                  </button>
                </div>
                
                <div className="relative pl-3 space-y-8">
                  {/* Vertical Line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100 z-0"></div>
                  
                  <div className="relative z-10 flex items-start gap-12">
                    <div className="flex items-center gap-4 w-32 shrink-0 pt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full outline outline-4 outline-white"></div>
                      <span className="text-xs font-bold text-green-600">Today</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800">Updated User Permission</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">Role Management</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap pt-1">10 mins ago</span>
                  </div>
                  
                  <div className="relative z-10 flex items-start gap-12">
                    <div className="flex items-center gap-4 w-32 shrink-0 pt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full outline outline-4 outline-white"></div>
                      <span className="text-xs font-bold text-green-600">Yesterday</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800">Created New Project</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">Project: HIRATE Enhancement</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap pt-1">1 day ago</span>
                  </div>
                  
                  <div className="relative z-10 flex items-start gap-12">
                    <div className="flex items-center gap-4 w-32 shrink-0 pt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full outline outline-4 outline-white"></div>
                      <span className="text-xs font-bold text-green-600">05 Aug 2026</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800">Updated Master List</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">Rating Categories</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap pt-1">2 days ago</span>
                  </div>
                  
                  <div className="relative z-10 flex items-start gap-12">
                    <div className="flex items-center gap-4 w-32 shrink-0 pt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full outline outline-4 outline-white"></div>
                      <span className="text-xs font-bold text-green-600">04 Aug 2026</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800">Logged In</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">Successful login</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap pt-1">3 days ago</span>
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
