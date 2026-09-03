import React, { useState, useEffect, useRef } from 'react';
import { LuSearch, LuChevronDown, LuCheck } from 'react-icons/lu';
import AnimatedDeliveryButton from './common/AnimatedDeliveryButton';

// Mock Data as requested for testability
const MOCK_CATEGORIES = ['Roadway', 'Road Signage and Furniture', 'Project Facilities', 'Structures', 'ATMS', 'TMS', 'Landscaping'];
const MOCK_ROUTES = [
  { id: 'route1', displayName: 'NH-44 Hyderabad to Bangalore' },
  { id: 'route2', displayName: 'NH-65 Pune to Machilipatnam' },
  { id: 'route3', displayName: 'Outer Ring Road (ORR)' }
];
const MOCK_USERS = [
  { _id: 'u1', name: 'Vijay', email: 'vijay@gmail.com', role: 'User' },
  { _id: 'u2', name: 'Tillu', email: 'tillu@hirate.com', role: 'User' },
  { _id: 'u3', name: 'Vishnu', email: 'vishnu@hirate.com', role: 'User' }
];

const BulkAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = MOCK_CATEGORIES,
  routes = MOCK_ROUTES,
  users = MOCK_USERS,
}) => {
  const [formData, setFormData] = useState({
    routeSection: '',
    category: categories[0] || 'Roadway',
    totalPages: '',
    autoSplit: true,
    selectedUserIds: []
  });
  
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsRouteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredRoutes = routes.filter(r => r.displayName.toLowerCase().includes(routeSearch.toLowerCase()));
  const activeRoute = routes.find(r => r.id === formData.routeSection);

  const handleSelectAll = () => {
    if (formData.selectedUserIds.length === users.length) {
      setFormData(prev => ({ ...prev, selectedUserIds: [] }));
    } else {
      setFormData(prev => ({ ...prev, selectedUserIds: users.map(u => u._id || u.id) }));
    }
  };

  const toggleUser = (id) => {
    setFormData(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(id)
        ? prev.selectedUserIds.filter(userId => userId !== id)
        : [...prev.selectedUserIds, id]
    }));
  };

  // Math Logic for Allocation Preview
  const selectedUsers = users.filter(u => formData.selectedUserIds.includes(u._id || u.id));
  const totalPagesNum = parseInt(formData.totalPages) || 0;
  const previewList = [];

  if (selectedUsers.length > 0 && totalPagesNum > 0) {
    if (formData.autoSplit) {
      const numUsers = selectedUsers.length;
      const basePages = Math.floor(totalPagesNum / numUsers);
      const remainder = totalPagesNum % numUsers;
      
      let currentStart = 1;
      for (let i = 0; i < numUsers; i++) {
        // Distribute remainder to the first few users
        const extra = i < remainder ? 1 : 0;
        const pagesForUser = basePages + extra;
        const currentEnd = currentStart + pagesForUser - 1;
        
        previewList.push({
          user: selectedUsers[i],
          startPage: currentStart,
          endPage: currentEnd,
          rangeStr: currentStart === currentEnd ? `Page ${currentStart}` : `Pages ${currentStart}-${currentEnd}`
        });
        currentStart = currentEnd + 1;
      }
    } else {
      selectedUsers.forEach(u => {
        previewList.push({
          user: u,
          startPage: 1,
          endPage: totalPagesNum,
          rangeStr: totalPagesNum === 1 ? `Page 1` : `Pages 1-${totalPagesNum}`
        });
      });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.routeSection || selectedUsers.length === 0 || totalPagesNum <= 0) return;

    const payload = {
      route: formData.routeSection,
      category: formData.category,
      autoSplit: formData.autoSplit,
      assignments: previewList.map(item => ({
        userId: item.user._id || item.user.id,
        startPage: item.startPage,
        endPage: item.endPage
      }))
    };
    
    console.log("Bulk Assignment Payload:", JSON.stringify(payload, null, 2));

    if (onSubmit) {
      setIsSubmitting(true);
      await onSubmit(payload);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full p-6 space-y-4 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Bulk Work Assignment</h3>
            <p className="text-sm text-gray-500 mt-1">Assign ranges of pages to multiple active users simultaneously.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors font-bold cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Route / Section */}
          <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            <label className="text-sm font-bold text-gray-800">
              Route / Section <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRouteOpen(!isRouteOpen)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-800 font-medium flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{activeRoute ? activeRoute.displayName : 'Select Route / Section'}</span>
                <LuChevronDown className="text-gray-400 text-base" />
              </button>
              
              {isRouteOpen && (
                <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col overflow-hidden max-h-48">
                  <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <LuSearch className="text-gray-400 text-sm shrink-0" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={routeSearch}
                      onChange={(e) => setRouteSearch(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-400 text-gray-800"
                    />
                  </div>
                  <div className="overflow-y-auto divide-y divide-gray-50">
                    {filteredRoutes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, routeSection: p.id }));
                          setIsRouteOpen(false);
                          setRouteSearch('');
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50/50 transition-colors font-medium ${
                          formData.routeSection === p.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {p.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-800">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-800 font-medium cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Total Pages Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-800">
                Total Pages <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Enter total pages (e.g. 100)"
                value={formData.totalPages}
                onChange={(e) => setFormData(prev => ({ ...prev, totalPages: e.target.value }))}
                className="h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-800 font-medium"
              />
            </div>
          </div>

          {/* Checkbox: Auto Split */}
          <div className="flex items-center gap-3 py-3 border-y border-gray-100 bg-slate-50 px-4 rounded-lg">
            <input
              type="checkbox"
              id="autoSplitCheck"
              checked={formData.autoSplit}
              onChange={(e) => setFormData(prev => ({ ...prev, autoSplit: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="autoSplitCheck" className="text-sm font-bold text-gray-800 cursor-pointer select-none">
              Auto Split Pages Equally
            </label>
          </div>

          {/* Multi-select Users */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <label className="text-sm font-bold text-gray-800">
                Select Active Users ({formData.selectedUserIds.length} selected) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                {formData.selectedUserIds.length === users.length ? 'Deselect All' : 'Select All Active'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[200px] overflow-y-auto bg-white p-1">
              {users.map(user => {
                const uId = user._id || user.id;
                const isChecked = formData.selectedUserIds.includes(uId);
                const initial = user.name.charAt(0).toUpperCase();
                return (
                  <div 
                    key={uId}
                    onClick={() => toggleUser(uId)}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                        {initial}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-sm block">{user.name}</span>
                        <span className="text-xs text-gray-500 block">{user.email} • {user.role}</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 pointer-events-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Table */}
          {previewList.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-sm font-bold text-gray-800 block">Allocation Preview</span>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">USER</th>
                      <th className="py-2 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">CALCULATED RANGE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-gray-800">{item.user.name}</td>
                        <td className="py-2.5 px-4 font-semibold text-green-600 bg-green-50/30">{item.rangeStr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <AnimatedDeliveryButton
              type="submit"
              disabled={isSubmitting}
              onClick={(e) => {
                if (!formData.routeSection || selectedUsers.length === 0 || totalPagesNum <= 0) {
                  e.preventDefault();
                  return false;
                }
                return true;
              }}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAssignmentModal;
