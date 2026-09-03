import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { workAssignmentService } from '../services/workAssignment.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LuFolder,
  LuFileText,
  LuFileCheck,
  LuTrendingUp
} from 'react-icons/lu';
import {
  MdOutlineDashboard,
  MdOutlineHistory,
  MdOutlineCalendarToday,
  MdOutlineDateRange,
  MdOutlineAssessment,
  MdOutlineAccessTime,
  MdExpandMore,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const projectOptions = [
  'All Projects',
  'ADTPL', 'APEL', 'BFHL', 'BWHPL', 'DATL', 'DHMEPL', 'FRHL', 'GAEPL',
  'JMTPL', 'JUHPL', 'KETPL', 'KHEPL', 'KMTPL', 'KTIPL', 'MBEL', 'MHPL',
  'MKTPL', 'MSHP', 'NAM', 'NDEPL', 'NKTPL', 'SIPL', 'SMTPL', 'SPPL',
  'WMPTL', 'WUPTL', 'WVEL'
];

const categoryMap = {
  'Roadway': 'Roadway',
  'Signage': 'Road Signage & Furniture',
  'Road Signage & Furniture': 'Road Signage & Furniture',
  'Structures': 'Structures',
  'Structure': 'Structures',
  'Drainage': 'Drainage',
  'Project Facilities': 'Facilities',
  'Facilities': 'Facilities',
  'ATMS': 'ATMS',
  'TMS': 'TMS',
  'Landscaping': 'Landscaping'
};

const durationOptions = [
  'This Month (July 2026)',
  'Last Month (June 2026)',
  'Last 3 Months',
  'Last 6 Months',
  'This Year (2026)'
];

const fallbackUsersList = [
  { name: 'Rahul Kumar', role: 'User', manager: 'Arun Kumar', status: 'Active' },
  { name: 'Sravya', role: 'Administrator', manager: 'Arun Kumar', status: 'Active' },
  { name: 'Kiran Reddy', role: 'User', manager: 'Arun Kumar', status: 'Active' },
  { name: 'Anil Kumar', role: 'User', manager: 'Arun Kumar', status: 'Active' },
  { name: 'Pooja Patel', role: 'Administrator', manager: 'Arun Kumar', status: 'Active' }
];

// Formatting Helper for Dates (e.g. 01 Jul 2026)
const formatDateLabel = (d) => {
  if (!d) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

// Parsing Date Strings to Date Objects (with timezone/time safety support)
const parseFlexibleDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const datePart = dateStr.split(',')[0].trim();
  const parts = datePart.split(' ');

  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);

    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    const monthKey = Object.keys(months).find(k => k.toLowerCase() === monthStr.toLowerCase());
    const month = monthKey !== undefined ? months[monthKey] : 6;

    return new Date(year, month, day);
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const parsePagesFromRange = (rangeStr) => {
  if (!rangeStr) return 0;
  const clean = rangeStr.replace(/[^\d-]/g, '');
  const parts = clean.split('-');
  if (parts.length === 2) {
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return (end - start) + 1;
    }
  }
  const single = parseInt(clean, 10);
  return !isNaN(single) ? single : 0;
};

// Reusable Custom Chart Tooltip
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-borderColor rounded-xl shadow-lg flex flex-col gap-1 text-xs text-left">
        <p className="font-extrabold text-textColor">{data.date || label}</p>
        <p className="font-medium text-gray-500">
          Pages Completed: <span className="font-extrabold text-primary">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// ==========================================
// COMPONENT: PROFESSIONAL DATE RANGE PICKER
// ==========================================
const DateRangePicker = ({ startDate, endDate, onRangeSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [navMonth, setNavMonth] = useState(6); // Default: July
  const [navYear, setNavYear] = useState(2026);
  const [tempRange, setTempRange] = useState({ start: startDate, end: endDate });
  const containerRef = useRef(null);

  useEffect(() => {
    setTempRange({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const prevNavMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear(prev => prev - 1);
    } else {
      setNavMonth(prev => prev - 1);
    }
  };

  const nextNavMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear(prev => prev + 1);
    } else {
      setNavMonth(prev => prev + 1);
    }
  };

  const handleDateClick = (date) => {
    // Optional: disable future dates relative to current local time (2026)
    const today = new Date(2026, 11, 31); // Keep max bound to end of mock database year
    if (date > today) return;

    if (!tempRange.start || (tempRange.start && tempRange.end)) {
      setTempRange({ start: date, end: null });
    } else if (tempRange.start && !tempRange.end) {
      if (date < tempRange.start) {
        setTempRange({ start: date, end: null });
      } else {
        const newRange = { start: tempRange.start, end: date };
        setTempRange(newRange);
        onRangeSelect(newRange.start, newRange.end);
        setIsOpen(false);
      }
    }
  };

  const isSameDate = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const checkIfToday = (d) => {
    // Highlights today's mock system time
    return isSameDate(d, new Date(2026, 6, 23));
  };

  const checkIfSelected = (d) => {
    return isSameDate(d, tempRange.start) || isSameDate(d, tempRange.end);
  };

  const checkIfInRange = (d) => {
    if (!tempRange.start || !tempRange.end) return false;
    return d >= tempRange.start && d <= tempRange.end;
  };

  const firstDayIndex = new Date(navYear, navMonth, 1).getDay();
  const totalDaysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl border border-borderColor bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm transition-colors text-gray-400 hover:text-primary cursor-pointer"
      >
        <MdOutlineCalendarToday className="text-base text-green-600" />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-2 z-50 bg-white border border-borderColor rounded-2xl p-4 shadow-2xl w-[310px] text-left"
        >
          {/* Calendar Picker Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <button onClick={prevNavMonth} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer text-textColor">
              <MdChevronLeft className="text-xl" />
            </button>
            <div className="flex items-center gap-1">
              <select
                value={navMonth}
                onChange={(e) => setNavMonth(parseInt(e.target.value))}
                className="text-xs font-bold text-textColor border border-borderColor bg-white rounded-lg px-1.5 py-1 focus:outline-none"
              >
                {monthsList.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={navYear}
                onChange={(e) => setNavYear(parseInt(e.target.value))}
                className="text-xs font-bold text-textColor border border-borderColor bg-white rounded-lg px-1.5 py-1 focus:outline-none"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={nextNavMonth} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer text-textColor">
              <MdChevronRight className="text-xl" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1 uppercase">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
              <div key={w} className="py-0.5">{w}</div>
            ))}
          </div>

          {/* Days Slots Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array(firstDayIndex).fill(null).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-1" />
            ))}
            {daysArray.map((day) => {
              const currentDate = new Date(navYear, navMonth, day);
              const isToday = checkIfToday(currentDate);
              const isSelected = checkIfSelected(currentDate);
              const isInRange = checkIfInRange(currentDate);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(currentDate)}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-150 relative cursor-pointer text-textColor hover:bg-gray-100
                    ${isSelected ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm font-extrabold' : ''}
                    ${isInRange && !isSelected ? 'bg-green-50 text-green-700 font-semibold' : ''}
                    ${isToday && !isSelected ? 'border border-green-600 text-green-600' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Popover bottom range overview */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 text-[10px] font-bold text-gray-500 flex flex-col gap-1 text-center">
            {tempRange.start && (
              <span>Start: <span className="text-green-600">{tempRange.start.toLocaleDateString()}</span></span>
            )}
            {tempRange.end && (
              <span>End: <span className="text-green-600">{tempRange.end.toLocaleDateString()}</span></span>
            )}
            {!tempRange.end && tempRange.start && (
              <span className="text-orange-500 font-medium">Select end date</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const projectColors = {
  'DATL': '#5cb85c',
  'APFI': '#2563EB',
  'NAM': '#8B5CF6',
  'BFHL': '#F59E0B',
  'BWHPL': '#14B8A6',
  'DHMEPL': '#EF4444',
  'GAEPL': '#EC4899',
  'APEL': '#6366F1'
};

const categoryColors = {
  'Roadway': '#5cb85c',
  'Drainage': '#2563EB',
  'Project Facilities': '#2563EB',
  'Facilities': '#2563EB',
  'Structures': '#8B5CF6',
  'Signage': '#F59E0B',
  'Road Signage & Furniture': '#F59E0B',
  'ATMS': '#FACC15',
  'TMS': '#14B8A6',
  'Landscaping': '#EC4899'
};

const getProjectColor = (proj) => {
  if (projectColors[proj]) return projectColors[proj];
  const palette = ['#5cb85c', '#2563EB', '#8B5CF6', '#F59E0B', '#14B8A6', '#EF4444', '#EC4899', '#6366F1', '#10B981', '#3B82F6'];
  const idx = (proj || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[idx % palette.length];
};

const getCategoryColor = (cat) => {
  if (categoryColors[cat]) return categoryColors[cat];
  const palette = ['#5cb85c', '#2563EB', '#8B5CF6', '#F59E0B', '#14B8A6', '#EF4444', '#EC4899', '#6366F1', '#10B981', '#3B82F6'];
  const idx = (cat || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[idx % palette.length];
};

// ==========================================
// SUBCOMPONENT 1: USER PROFILE SUMMARY CARD
// ==========================================
const UserProfileSummaryCard = ({ currentUserObj, assignments, parsePagesFromRange }) => {
  const firstLetter = currentUserObj?.name ? currentUserObj.name.charAt(0).toUpperCase() : '?';

  const userAssignments = assignments.filter(a => a.userName.toLowerCase() === (currentUserObj?.name || '').toLowerCase());
  const uniqueProjects = [...new Set(userAssignments.map(a => a.routeSection || a.project).filter(p => p && p !== 'HO PROCESS' && p !== 'ON-GOING' && p !== 'SPV RATED' && p !== 'HO RATED' && p !== 'NOT RATED'))].length;
  const totalAssigned = userAssignments.reduce((sum, a) => sum + parsePagesFromRange(a.subSection || a.pageRange || ''), 0);
  const completedAssignments = userAssignments.filter(a => a.status === 'Completed');
  const totalCompleted = completedAssignments.reduce((sum, a) => sum + parsePagesFromRange(a.subSection || a.pageRange || ''), 0);
  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-8 w-full">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-extrabold uppercase shadow-sm shrink-0 border border-green-400/20">
          {firstLetter}
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-textColor">{currentUserObj?.name}</h2>
            {currentUserObj?.status === 'Active' && (
              <span className="bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-green-100 shadow-sm uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Role : <span className="font-bold text-textColor">{currentUserObj?.role || 'User'}</span>
          </p>
          <p className="text-sm font-medium text-gray-500">
            Reporting Manager : <span className="font-bold text-textColor">{currentUserObj?.manager || 'Arun Kumar'}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-8 md:gap-12 lg:gap-16 xl:gap-20">
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-50 text-green-600 flex items-center justify-center shrink-0 shadow-sm border border-green-100">
              <LuFolder className="text-xs" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Projects</span>
          </div>
          <div className="pl-8">
            <span className="text-2xl font-extrabold text-textColor block leading-none">{uniqueProjects}</span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1 font-semibold">Active</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
              <LuFileText className="text-xs" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pages Assigned</span>
          </div>
          <div className="pl-8">
            <span className="text-2xl font-extrabold text-textColor block leading-none">{totalAssigned}</span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1 font-semibold">Targets</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-sm border border-purple-100">
              <LuFileCheck className="text-xs" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pages Completed</span>
          </div>
          <div className="pl-8">
            <span className="text-2xl font-extrabold text-textColor block leading-none">{totalCompleted}</span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1 font-semibold">Outputs</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Overall<br />Completion
            </span>
            <span className="text-2xl font-extrabold text-textColor mt-0.5 block leading-none">
              {completionRate}%
            </span>
          </div>
          <div className="relative flex items-center justify-center w-[64px] h-[64px] shrink-0">
            <svg height={64} width={64} className="transform -rotate-90">
              <circle stroke="#E5E7EB" fill="transparent" strokeWidth={4} r={24} cx={32} cy={32} />
              <circle
                stroke="#5cb85c"
                fill="transparent"
                strokeWidth={4}
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 - (completionRate / 100) * (2 * Math.PI * 24)}
                strokeLinecap="round"
                r={24}
                cx={32}
                cy={32}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex items-center justify-center bg-green-50 rounded-full w-9 h-9 border border-green-100 shadow-sm">
              <LuTrendingUp className="text-green-600 text-base" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 2: WEEKLY REPORT CARD
// ==========================================
const WeeklyReportCard = ({ chartWeeklyData, totalWeeklyPages, weeklyDailyAverage, fullWidth = false, startDate, endDate, handleCustomRangeSelect }) => {
  const maxWeeklyVal = Math.max(...chartWeeklyData.map(d => d.pages));

  const renderCustomBarLabel = ({ x, y, width, value }) => {
    if (value === 0) return null;
    const isPeak = value === maxWeeklyVal && value > 0;
    return (
      <text x={x + width / 2} y={y - 8} fill={isPeak ? "#5cb85c" : "#374151"} textAnchor="middle" className="text-[11px] font-extrabold">
        {value}
      </text>
    );
  };

  const CustomBarTick = ({ x, y, payload }) => {
    const item = chartWeeklyData.find(d => d.name === payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={12} dy={0} textAnchor="middle" fill="#374151" className="text-[11px] font-bold">
          {payload.value}
        </text>
        {item && (
          <text x={0} y={24} dy={0} textAnchor="middle" fill="#9CA3AF" className="text-[10px] font-medium">
            {item.subName}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-6 h-full justify-between w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-textColor uppercase tracking-wider">Weekly Report</h3>
          <span className="text-sm font-bold text-[#2563EB]">
            {formatDateLabel(startDate)} - {formatDateLabel(endDate)}
          </span>
        </div>

        {/* Functional Date Range Picker Calendar Icon Popover */}
        <DateRangePicker startDate={startDate} endDate={endDate} onRangeSelect={handleCustomRangeSelect} />
      </div>

      <div className={`flex flex-col ${fullWidth ? 'md:flex-row' : 'sm:flex-row'} gap-6 w-full h-[280px]`}>
        <div className={`w-full ${fullWidth ? 'md:w-[220px]' : 'sm:w-[160px]'} shrink-0 flex flex-col justify-center gap-6 bg-gray-50/50 border border-gray-100 rounded-xl p-5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]`}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none">Total Pages Completed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-textColor">{totalWeeklyPages}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Pages</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none">Daily Average</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-textColor">{weeklyDailyAverage}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Pages</span>
            </div>
          </div>
        </div>

        <div className="flex-1 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartWeeklyData} margin={{ top: 20, right: 10, left: -25, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={<CustomBarTick />} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} domain={[0, 'auto']} />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(92,184,92,0.05)' }} />
              <Bar dataKey="pages" fill="#5cb85c" radius={[5, 5, 0, 0]} barSize={fullWidth ? 36 : 24} label={renderCustomBarLabel} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 3: MONTHLY REPORT CARD
// ==========================================
const MonthlyReportCard = ({ chartMonthlyData, totalMonthlyPages, monthlyDailyAverage, fullWidth = false, startDate, endDate, handleCustomRangeSelect }) => {
  const maxMonthlyVal = Math.max(...chartMonthlyData.map(d => d.pages));

  const renderCustomLineLabel = ({ x, y, value }) => {
    if (value === 0) return null;
    const isPeak = value === maxMonthlyVal && value > 0;
    return (
      <text x={x} y={y - 12} fill={isPeak ? "#5cb85c" : "#374151"} textAnchor="middle" className="text-[11px] font-extrabold">
        {value}
      </text>
    );
  };

  const CustomLineTick = ({ x, y, payload }) => {
    const item = chartMonthlyData.find(d => d.name === payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={12} dy={0} textAnchor="middle" fill="#374151" className="text-[11px] font-bold">
          {payload.value}
        </text>
        {item && (
          <text x={0} y={24} dy={0} textAnchor="middle" fill="#9CA3AF" className="text-[10px] font-medium">
            {item.subName}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-6 h-full justify-between w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-textColor uppercase tracking-wider">Monthly Report</h3>
          <span className="text-sm font-bold text-[#2563EB]">
            {formatDateLabel(startDate)} - {formatDateLabel(endDate)}
          </span>
        </div>

        {/* Functional Date Range Picker Calendar Icon Popover */}
        <DateRangePicker startDate={startDate} endDate={endDate} onRangeSelect={handleCustomRangeSelect} />
      </div>

      <div className={`flex flex-col ${fullWidth ? 'md:flex-row' : 'sm:flex-row'} gap-6 w-full h-[280px]`}>
        <div className={`w-full ${fullWidth ? 'md:w-[220px]' : 'sm:w-[160px]'} shrink-0 flex flex-col justify-center gap-6 bg-gray-50/50 border border-gray-100 rounded-xl p-5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]`}>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none">Total Pages Completed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-textColor">{totalMonthlyPages}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Pages</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none">Daily Average</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-textColor">{monthlyDailyAverage}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Pages</span>
            </div>
          </div>
        </div>

        <div className="flex-1 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartMonthlyData} margin={{ top: 20, right: 10, left: -25, bottom: 15 }}>
              <defs>
                <linearGradient id="colorGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5cb85c" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#5cb85c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={<CustomLineTick />} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} domain={[0, 'auto']} />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="pages"
                stroke="#5cb85c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorGreenGrad)"
                dot={{ r: 5, fill: '#5cb85c', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                label={renderCustomLineLabel}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 4: WORK HISTORY TABLE CARD
// ==========================================
const WorkHistoryTableCard = ({ paginatedTableData, formattedWorkHistory, tablePage, setTablePage, TABLE_ITEMS_PER_PAGE, totalTablePages }) => {
  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 h-full w-full">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1 pb-1">
          <h2 className="text-base font-bold text-textColor uppercase tracking-wider">Work History</h2>
          <p className="text-muted text-sm font-normal">Detailed work completed by the selected user.</p>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Project</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Page Range</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pages Assigned</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned By</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTableData.length > 0 ? (
                paginatedTableData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-textColor text-sm font-semibold whitespace-nowrap">{item.date}</td>
                    <td className="py-3.5 px-4 text-textColor text-sm font-semibold whitespace-nowrap">{item.project}</td>
                    <td className="py-3.5 px-4 text-gray-600 text-sm font-medium whitespace-nowrap">{item.category}</td>
                    <td className="py-3.5 px-4 text-textColor text-sm font-bold whitespace-nowrap">{item.pageRange || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-textColor text-sm font-bold whitespace-nowrap">{item.pagesAssigned} Pages</td>
                    <td className="py-3.5 px-4 text-gray-500 text-sm font-semibold whitespace-nowrap">{item.assignedBy || 'Admin'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {(() => {
                        const statusUpper = (item.status || 'ASSIGNED').trim().toUpperCase();
                        if (statusUpper === 'COMPLETED') {
                          return (
                            <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm uppercase tracking-wider">
                              COMPLETED
                            </span>
                          );
                        }
                        if (statusUpper === 'IN PROGRESS') {
                          return (
                            <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100 shadow-sm uppercase tracking-wider">
                              IN PROGRESS
                            </span>
                          );
                        }
                        if (statusUpper === 'REJECTED') {
                          return (
                            <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-red-50 text-red-600 border-red-100 shadow-sm uppercase tracking-wider">
                              REJECTED
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100 shadow-sm uppercase tracking-wider">
                            {statusUpper}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <LuFileText className="text-xl" />
                      <span>No work history entries found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalTablePages > 1 && (
        <div className="pt-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <span className="text-xs text-gray-500 font-bold">
            Showing {(tablePage - 1) * TABLE_ITEMS_PER_PAGE + 1} to {Math.min(tablePage * TABLE_ITEMS_PER_PAGE, formattedWorkHistory.length)} of {formattedWorkHistory.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTablePage(prev => Math.max(prev - 1, 1))}
              disabled={tablePage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <MdChevronLeft className="text-lg" />
            </button>
            {Array.from({ length: totalTablePages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setTablePage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer ${tablePage === p ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setTablePage(prev => Math.min(prev + 1, totalTablePages))}
              disabled={tablePage === totalTablePages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <MdChevronRight className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 5: MONTHLY PROJECT SUMMARY
// ==========================================
const MonthlyProjectSummaryCard = ({ pieData, totalMonthlyPages, fullWidth = false }) => {
  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 h-full w-full">
      <div className="flex flex-col gap-1 pb-1">
        <h2 className="text-base font-bold text-textColor uppercase tracking-wider">Monthly Project Summary</h2>
      </div>

      <div className={`flex flex-col ${fullWidth ? 'md:flex-row items-center justify-around gap-12 py-6' : 'sm:flex-row gap-5'} my-2`}>
        <div className="relative w-[150px] h-[150px] shrink-0 mx-auto sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={50} outerRadius={68} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-textColor leading-none">{totalMonthlyPages}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Pages</span>
          </div>
        </div>

        <div className={`flex-1 flex flex-col gap-3.5 w-full ${fullWidth ? 'max-w-[400px]' : ''}`}>
          {pieData.length > 0 ? (
            pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-extrabold text-textColor">{item.name}</span>
                </div>
                <span className="flex-1 border-b border-dotted border-gray-300 mx-2" />
                <div className="flex items-center gap-1.5 shrink-0 text-textColor text-[11px] font-bold">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>{item.value} Pages ({item.percentage}%)</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-gray-400 py-6 w-full font-semibold">
              No Project Summary Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 6: PROJECT-WISE CHART CARD
// ==========================================
const ProjectWiseChartCard = ({ projectWiseData, CustomProjectYTick, renderHorizontalBarLabel, height = "340px" }) => {
  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5 w-full" style={{ height }}>
      <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Project-wise Pages Completed (This Month)</h3>
      <div className="flex-1 h-full w-full relative">
        {projectWiseData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectWiseData} layout="vertical" margin={{ top: 10, right: 35, left: 15, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={<CustomProjectYTick />} axisLine={false} tickLine={false} width={50} />
              <Bar dataKey="pages" radius={[0, 4, 4, 0]} barSize={14} label={renderHorizontalBarLabel}>
                {projectWiseData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-gray-400 font-semibold">
            No Project Data Available
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 7: CATEGORY-WISE CHART CARD
// ==========================================
const CategoryWiseChartCard = ({ categoryWiseData, CustomCategoryYTick, renderHorizontalBarLabel }) => {
  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5 h-[340px] w-full">
      <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Category-wise Pages Completed (This Month)</h3>
      <div className="flex-1 h-full w-full relative">
        {categoryWiseData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryWiseData} layout="vertical" margin={{ top: 10, right: 35, left: 10, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={<CustomCategoryYTick />} axisLine={false} tickLine={false} width={120} />
              <Bar dataKey="pages" radius={[0, 4, 4, 0]} barSize={14} label={renderHorizontalBarLabel}>
                {categoryWiseData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-gray-400 font-semibold">
            No Category Data Available
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 8: ACTIVITY TIMELINE CARD
// ==========================================
const ActivityTimelineCard = ({
  currentMonthYear,
  handlePrevMonth,
  handleNextMonth,
  hoveredDay,
  setHoveredDay,
  daysList,
  getDayActivityDetails,
  fullWidth = false,
  isCompletedMode = true
}) => {
  return (
    <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 w-full relative" style={{ height: fullWidth ? '380px' : '340px' }}>
      <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Activity Timeline (This Month)</h3>

      <div className="flex items-center justify-between bg-gray-50/50 border border-gray-100 rounded-xl p-2.5 max-w-[400px] mx-auto w-full">
        <button onClick={handlePrevMonth} className="w-7 h-7 rounded-lg border border-borderColor bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm text-textColor cursor-pointer transition-colors">
          <MdChevronLeft className="text-base" />
        </button>
        <span className="text-sm font-extrabold text-textColor">{currentMonthYear}</span>
        <button onClick={handleNextMonth} className="w-7 h-7 rounded-lg border border-borderColor bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm text-textColor cursor-pointer transition-colors">
          <MdChevronRight className="text-base" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center w-full min-h-[100px]">
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-30 bottom-[95px] left-1/2 -translate-x-1/2 bg-white border border-borderColor rounded-xl p-4 shadow-xl text-[11px] flex flex-col gap-1.5 w-[200px] text-left animate-fade-in"
          >
            <h4 className="font-extrabold text-textColor pb-1 border-b border-gray-100">{hoveredDay.dateStr}</h4>
            {hoveredDay.hasActivity ? (
              <>
                <p className="font-medium text-gray-500">Project: <span className="font-extrabold text-textColor">{hoveredDay.project}</span></p>
                <p className="font-medium text-gray-500">Category: <span className="font-extrabold text-textColor">{hoveredDay.category}</span></p>
                <p className="font-medium text-gray-500 font-bold">
                  {hoveredDay.isCompletedMode ? 'Pages Completed: ' : 'Pages Assigned: '}
                  <span className="font-extrabold text-primary">{hoveredDay.pagesCompleted} Pages</span>
                </p>
              </>
            ) : (
              <p className="text-gray-400 font-semibold py-1">
                {hoveredDay.isCompletedMode ? 'No Activity Completed' : 'No Activity Assigned'}
              </p>
            )}
          </motion.div>
        )}

        <div className="flex items-center gap-3.5 overflow-x-auto scrollbar-none py-3.5 px-1 w-full text-center select-none justify-start md:justify-center">
          {daysList.map(dayNum => {
            const dayAct = getDayActivityDetails(dayNum);
            return (
              <div
                key={dayNum}
                onMouseEnter={() => setHoveredDay(dayAct)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex flex-col items-center gap-1.5 shrink-0 min-w-[24px] cursor-pointer"
              >
                <span className="text-xs font-extrabold text-textColor">{dayNum}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">{dayAct.weekday}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1 border transition-all duration-200 ${dayAct.hasActivity
                    ? 'bg-primary border-green-500 shadow-[0_0_8px_rgba(92,184,92,0.4)] scale-110'
                    : 'bg-gray-300 border-gray-400/20'
                    }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-textColor font-bold border-t border-gray-100 pt-4 mt-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>{isCompletedMode ? 'Work Completed' : 'Work Assigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span>{isCompletedMode ? 'No Activity' : 'No Assignment'}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT 8: DETAILED PROJECT REPORT VIEW
// ==========================================
const DetailedProjectReportView = ({ projectName, userAssignments, currentUserObj, onClose, CustomCategoryYTick, renderHorizontalBarLabel }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // Filter records belonging to this specific user & project
  const projRecords = userAssignments.filter(a => {
    const isProj = (a.routeSection || a.project) === projectName;
    return isProj;
  });

  const isCompletedProject = projRecords.some(r => r.status === 'Completed');

  // KPI Computations
  const totalAssignedPages = projRecords.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
  const totalCompletedPages = projRecords.filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
  const completionPercentage = totalAssignedPages > 0 ? Math.round((totalCompletedPages / totalAssignedPages) * 100) : 0;
  const uniqueCategories = [...new Set(projRecords.map(r => categoryMap[r.category] || r.category))].length;
  // Dynamic images rated calculation: ~12 images/chainages per completed page
  const totalImagesRated = totalCompletedPages * 12;

  // Find the last activity date from completion dates or assignment dates
  const dates = projRecords.map(r => parseFlexibleDate(r.completedOn || r.assignedOn)).filter(d => d);
  const lastActivityDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

  const formatDateString = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Group by category inside this project for Category Performance horizontal bar chart
  const reportCategoryGroups = {};
  projRecords.forEach(r => {
    const cat = categoryMap[r.category] || r.category;
    const pages = parsePagesFromRange(r.subSection || r.pageRange || '');
    if (r.status === 'Completed' || !isCompletedProject) {
      reportCategoryGroups[cat] = (reportCategoryGroups[cat] || 0) + pages;
    }
  });

  const categoryPerfData = Object.entries(reportCategoryGroups)
    .map(([name, pages]) => ({
      name,
      pages,
      color: getCategoryColor(name)
    }))
    .sort((a, b) => b.pages - a.pages);

  // Generate dynamic rating details/images for completed inspection items
  const ratingDetails = [];
  const completedRecords = projRecords.filter(r => r.status === 'Completed');

  completedRecords.forEach((r, idx) => {
    const cat = categoryMap[r.category] || r.category;
    const pagesList = [];
    // Extract pages from range
    const rangeMatch = (r.subSection || r.pageRange || '').match(/(\d+)-(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      for (let i = start; i <= end && pagesList.length < 3; i++) {
        pagesList.push(i);
      }
    } else {
      pagesList.push(1);
    }

    // Mock high-fidelity images/rating cards per page/record
    pagesList.forEach((page, pIdx) => {
      const score = (8.2 + (pIdx * 0.4 + idx * 0.3) % 1.7).toFixed(1);
      const isComplianceIssue = parseFloat(score) < 8.5;
      const remarks = isComplianceIssue
        ? `Minor cracks & dust observed in ${cat} inspection section.`
        : `Excellent compliance. Surface layout & structural features verified.`;

      const catColor = getCategoryColor(cat);

      ratingDetails.push({
        id: `img-${idx}-${pIdx}`,
        category: cat,
        pageNumber: page,
        ratingScore: score,
        remarks: remarks,
        inspectorName: currentUserObj?.name || 'Sravya',
        inspectionDate: r.completedOn || '24 Jul 2026',
        color: catColor
      });
    });
  });

  // Export report handler
  const handleExportCSV = () => {
    const headers = 'Date,Category,Page Range,Pages Assigned,Pages Completed,Status,Remarks\n';
    const rows = projRecords.map(r => {
      const dateStr = r.completedOn || r.assignedOn || '';
      const cat = categoryMap[r.category] || r.category;
      const range = r.subSection || r.pageRange || '';
      const assigned = parsePagesFromRange(r.subSection || r.pageRange || '');
      const completed = r.status === 'Completed' ? assigned : 0;
      const remarks = r.status === 'Completed' ? 'Inspection Verified' : 'Pending';
      return `"${dateStr}","${cat}","${range}",${assigned},${completed},"${r.status}","${remarks}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName}_Inspection_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF handler
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full print:p-0 print:m-0">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-borderColor print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-primary border border-borderColor hover:border-primary rounded-xl bg-white shadow-sm transition-all duration-200 cursor-pointer"
        >
          <span>←</span> Back to Insights
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 hover:text-textColor border border-borderColor bg-white hover:bg-gray-50 rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <span className="text-base">⤓</span> Export Report
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-[#4cae4c] rounded-xl shadow-md transition-all duration-200 cursor-pointer"
          >
            <span className="text-base">⎙</span> Download PDF
          </button>
        </div>
      </div>

      {/* Header section card */}
      <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between gap-6 print:border-none print:shadow-none">
        <div className="flex items-start gap-4">
          {/* Project Shield Logo */}
          <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md" style={{ backgroundColor: getProjectColor(projectName) }}>
            {projectName}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-textColor leading-tight">{projectName} - Highway Project</h2>
              <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-wider">
                Active Report
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">SPV Name: {projectName === 'DATL' ? 'Delhi Agra Tollway Limited' : projectName === 'APFI' ? 'Andhra Pradesh Expressway Limited' : projectName === 'NAM' ? 'N A M Expressway Limited' : `${projectName} Highways Limited`}</p>
            <div className="flex items-center gap-6 mt-2 text-xs text-gray-500 font-semibold flex-wrap">
              <div>Assigned Inspector: <span className="text-textColor font-bold">{currentUserObj?.name}</span></div>
              <div>Inspection Period: <span className="text-textColor font-bold">{dates.length > 0 ? `${formatDateString(new Date(Math.min(...dates)))} - ${formatDateString(new Date(Math.max(...dates)))}` : 'N/A'}</span></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:items-end justify-between text-left md:text-right shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Report Metadata</div>
          <div className="text-xs text-gray-500 mt-1 font-semibold">Generated Date: <span className="text-textColor font-bold">{formatDateString(new Date())}</span></div>
          <div className="text-xs text-gray-500 font-semibold">Compliance Status: <span className={completionPercentage === 100 ? "text-emerald-600 font-bold" : "text-yellow-600 font-bold"}>{completionPercentage === 100 ? "Fully Inspected" : "Under Review"}</span></div>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 print:grid-cols-3">
        <div className="bg-white rounded-2xl border border-borderColor p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Pages Assigned</span>
          <span className="text-2xl font-black text-textColor">{totalAssignedPages} Pages</span>
        </div>
        <div className="bg-white rounded-2xl border border-borderColor p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Pages Completed</span>
          <span className="text-2xl font-black text-textColor">{totalCompletedPages} Pages</span>
        </div>
        <div className="bg-white rounded-2xl border border-borderColor p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Completion %</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-textColor">{completionPercentage}%</span>
            <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-borderColor p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Categories</span>
          <span className="text-2xl font-black text-textColor">{uniqueCategories}</span>
        </div>
        <div className="bg-white rounded-2xl border border-borderColor p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Images Rated</span>
          <span className="text-2xl font-black text-textColor">{totalImagesRated}</span>
        </div>
        <div className="bg-white rounded-2xl border border-borderColor p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Activity Date</span>
          <span className="text-sm font-extrabold text-textColor mt-auto pb-1">{formatDateString(lastActivityDate)}</span>
        </div>
      </div>

      {/* Main Report Sections Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left 2 Cols: Project Work Summary Table & Image/Rating Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Project Work Summary Card */}
          <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5 print:shadow-none">
            <div className="flex flex-col gap-1 pb-1">
              <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Project Work Summary</h3>
              <p className="text-muted text-xs font-normal">Execution tracking per category and page range.</p>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Page Range</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pages Assigned</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pages Completed</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projRecords.map((r, idx) => {
                    const dateToUse = r.completedOn || r.assignedOn || 'N/A';
                    const cat = categoryMap[r.category] || r.category;
                    const assignedPages = parsePagesFromRange(r.subSection || r.pageRange || '');
                    const completedPages = r.status === 'Completed' ? assignedPages : 0;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 text-textColor text-xs font-semibold whitespace-nowrap">{dateToUse}</td>
                        <td className="py-3 px-4 text-textColor text-xs font-semibold whitespace-nowrap">{cat}</td>
                        <td className="py-3 px-4 text-textColor text-xs font-bold whitespace-nowrap">{r.subSection || r.pageRange || 'N/A'}</td>
                        <td className="py-3 px-4 text-textColor text-xs font-bold whitespace-nowrap text-center">{assignedPages}</td>
                        <td className="py-3 px-4 text-textColor text-xs font-bold whitespace-nowrap text-center">{completedPages}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {r.status === 'Completed' ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm uppercase tracking-wider">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100 shadow-sm uppercase tracking-wider">
                              Assigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs font-medium max-w-[200px] truncate" title={r.status === 'Completed' ? 'Inspection Verified - Good Condition' : 'Pending Rating'}>
                          {r.status === 'Completed' ? 'Inspection Verified - Good Condition' : 'Pending Rating'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Image / Rating Details Card */}
          <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5 print:shadow-none">
            <div className="flex flex-col gap-1 pb-1">
              <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Image / Rating Details</h3>
              <p className="text-muted text-xs font-normal">Individual visual checklist items and compliance grades.</p>
            </div>

            {ratingDetails.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratingDetails.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 border border-borderColor p-4 rounded-xl hover:shadow-sm transition-all duration-200 bg-white"
                  >
                    <div
                      onClick={() => setSelectedImage(item)}
                      className="w-20 h-20 shrink-0 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold text-white shadow-inner cursor-zoom-in relative group overflow-hidden"
                      style={{ backgroundColor: item.color }}
                    >
                      <span className="text-lg">📷</span>
                      <span>Page {item.pageNumber}</span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs">🔍</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-textColor truncate">{item.category}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">Page: {item.pageNumber} | {item.inspectionDate}</div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold ${parseFloat(item.ratingScore) >= 8.8 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                          {item.ratingScore}/10
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-normal line-clamp-2 mt-1" title={item.remarks}>{item.remarks}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-borderColor rounded-xl text-xs text-gray-400 font-semibold gap-2">
                <span>⚠️</span>
                <span>No Inspection Ratings Compiled (No completed pages yet).</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Category Performance & Project Timeline */}
        <div className="space-y-6">
          {/* Category Performance Card */}
          <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5 h-full min-h-[340px] print:shadow-none">
            <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Category Performance</h3>
            <div className="flex-1 h-full w-full relative">
              {categoryPerfData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryPerfData} layout="vertical" margin={{ top: 10, right: 35, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={<CustomCategoryYTick />} axisLine={false} tickLine={false} width={120} />
                    <Bar dataKey="pages" radius={[0, 4, 4, 0]} barSize={12} label={renderHorizontalBarLabel}>
                      {categoryPerfData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-400 font-semibold">
                  No Category Data Available
                </div>
              )}
            </div>
          </div>

          {/* Project Timeline Card */}
          <div className="bg-white rounded-2xl border border-borderColor p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5 print:shadow-none">
            <h3 className="text-xs font-bold text-textColor uppercase tracking-wider">Project Timeline</h3>
            <div className="relative border-l border-borderColor pl-6 space-y-6 ml-3">
              {/* Assignment Date */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-100 border border-emerald-50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-textColor">Assignment Initiated</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{dates.length > 0 ? formatDateString(new Date(Math.min(...dates))) : 'N/A'}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Task assignments registered on database.</p>
                </div>
              </div>

              {/* Started Date */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-100 border border-blue-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-textColor">Inspection Started</span>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    {dates.length > 0 ? formatDateString(new Date(new Date(Math.min(...dates)).getTime() + 86400000)) : 'N/A'}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Data collection and camera calibration verified.</p>
                </div>
              </div>

              {/* Completed Date */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-100 border border-purple-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-textColor">Completed / Last Updated</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{formatDateString(lastActivityDate)}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Final quality audits checked by Admin.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4 cursor-zoom-out print:hidden"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-textColor">{selectedImage.category}</h4>
                <p className="text-xs text-gray-400 font-semibold">Page {selectedImage.pageNumber} | Inspection Details</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-textColor text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-80 rounded-xl flex flex-col items-center justify-center text-white font-extrabold text-lg shadow-inner" style={{ backgroundColor: selectedImage.color }}>
              <span className="text-5xl">📷</span>
              <span className="mt-4">Highway Inspection Frame (Page {selectedImage.pageNumber})</span>
              <span className="text-xs opacity-80 mt-2">Chainage Coordinates: MCW-LHS Km {(selectedImage.pageNumber * 2.5).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center gap-4 bg-gray-50 p-4 rounded-xl border border-borderColor">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Inspection Note</span>
                <p className="text-xs text-gray-600 font-semibold mt-1">{selectedImage.remarks}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Compliance Grade</span>
                <div className="text-lg font-black text-primary mt-0.5">{selectedImage.ratingScore}/10</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// PRIMARY EXPORT: USER INSIGHTS PAGE
// ==========================================
const UserInsightsPage = () => {
  const { userId } = useParams();
  const [usersList, setUsersList] = useState(fallbackUsersList);
  const [selectedUser, setSelectedUser] = useState(() => {
    const saved = localStorage.getItem('hirate-selected-user');
    if (saved) {
      try {
        if (saved.trim().startsWith('{')) {
          return JSON.parse(saved);
        }
      } catch (e) { }
      return { name: saved, role: 'User', manager: 'Arun Kumar', status: 'Active' };
    }
    return { name: 'Rahul Kumar', role: 'User', manager: 'Arun Kumar', status: 'Active' };
  });
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedDuration, setSelectedDuration] = useState('This Month (July 2026)');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Date selection states
  const [startDate, setStartDate] = useState(new Date(2026, 6, 1)); // 01 Jul 2026
  const [endDate, setEndDate] = useState(new Date(2026, 6, 31)); // 31 Jul 2026

  // Dynamic applied filters
  const [appliedUser, setAppliedUser] = useState(() => {
    const saved = localStorage.getItem('hirate-selected-user');
    if (saved) {
      try {
        if (saved.trim().startsWith('{')) {
          return JSON.parse(saved);
        }
      } catch (e) { }
      return { name: saved, role: 'User', manager: 'Arun Kumar', status: 'Active' };
    }
    return { name: 'Rahul Kumar', role: 'User', manager: 'Arun Kumar', status: 'Active' };
  });
  const [appliedProject, setAppliedProject] = useState('All Projects');

  // Tab Navigation Routing
  const [activeTab, setActiveTab] = useState('Overview');
  const [currentMonthYear, setCurrentMonthYear] = useState('July 2026');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeReportProject, setActiveReportProject] = useState(null);

  // Live assignments state from localStorage
  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem('hirate-assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { }
    }

    // Seed same initial assignments to keep single source of truth initialized
    const initialAssignments = [
      {
        id: 'task-1',
        userName: 'Sravya',
        project: 'APFI',
        category: 'Roadway',
        routeSection: 'APFI',
        routeSectionName: 'Andhra Pradesh Expressway Limited (APFI)',
        subSection: 'Pages 10-20',
        priority: 'High',
        status: 'Pending',
        due: '2026-07-20',
        assignedOn: '14 Jul 2026, 05:28 PM',
        timeline: [
          {
            timestamp: '14 Jul 2026, 05:28 PM',
            action: 'Assigned by Admin',
            performedBy: 'Admin',
            remarks: 'Please complete the rating for the HO process images. Ensure accuracy and submit before the due date.'
          }
        ]
      },
      {
        id: 'task-2',
        userName: 'Rahul Kumar',
        project: 'SPPL',
        category: 'Structures',
        routeSection: 'SPPL',
        routeSectionName: 'KNR Shankarampet Projects Private Limited (SPPL)',
        subSection: 'Pages 5-10',
        priority: 'Medium',
        status: 'In Progress',
        due: '2026-07-21',
        assignedOn: '14 Jul 2026, 04:45 PM',
        timeline: [
          {
            timestamp: '14 Jul 2026, 04:45 PM',
            action: 'Assigned by Admin',
            performedBy: 'Admin',
            remarks: 'Verify structures rating.'
          },
          {
            timestamp: '14 Jul 2026, 05:00 PM',
            action: 'Opened by User',
            performedBy: 'Rahul Kumar',
            remarks: 'Task is visible on my dashboard.'
          }
        ]
      },
      {
        id: 'task-3',
        userName: 'Kiran Reddy',
        project: 'JMTPL',
        category: 'ATMS',
        routeSection: 'JMTPL',
        routeSectionName: 'Jaipur-Mahua Tollway Private Limited (JMTPL)',
        subSection: 'Page 1',
        priority: 'Low',
        status: 'Completed',
        due: '2026-07-13',
        assignedOn: '13 Jul 2026, 11:20 AM',
        completedOn: '13 Jul 2026, 12:25 PM',
        timeline: [
          {
            timestamp: '13 Jul 2026, 11:20 AM',
            action: 'Assigned by Admin',
            performedBy: 'Admin',
            remarks: 'Review ATMS images.'
          },
          {
            timestamp: '13 Jul 2026, 11:35 AM',
            action: 'Opened by User',
            performedBy: 'Kiran Reddy',
            remarks: 'Started rating images.'
          },
          {
            timestamp: '13 Jul 2026, 12:25 PM',
            action: 'Marked Completed',
            performedBy: 'Kiran Reddy',
            remarks: 'All rating details submitted.'
          }
        ]
      },
      // --- Rahul Kumar Completed Tasks ---
      { id: 't-rahul-1', userName: 'Rahul Kumar', project: 'DATL', category: 'Roadway', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 81-120', priority: 'Medium', status: 'Completed', due: '2026-07-25', assignedOn: '23 Jul 2026, 10:00 AM', completedOn: '24 Jul 2026, 02:00 PM', timeline: [{ timestamp: '24 Jul 2026, 02:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-2', userName: 'Rahul Kumar', project: 'DATL', category: 'Drainage', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 41-80', priority: 'Medium', status: 'Completed', due: '2026-07-23', assignedOn: '21 Jul 2026, 10:00 AM', completedOn: '22 Jul 2026, 11:30 AM', timeline: [{ timestamp: '22 Jul 2026, 11:30 AM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-3', userName: 'Rahul Kumar', project: 'DATL', category: 'Roadway', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 1-40', priority: 'Medium', status: 'Completed', due: '2026-07-23', assignedOn: '21 Jul 2026, 10:00 AM', completedOn: '22 Jul 2026, 03:30 PM', timeline: [{ timestamp: '22 Jul 2026, 03:30 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-4', userName: 'Rahul Kumar', project: 'APFI', category: 'Structures', routeSection: 'APFI', routeSectionName: 'Andhra Pradesh Expressway Limited (APFI)', subSection: 'Pages 1-35', priority: 'Medium', status: 'Completed', due: '2026-07-24', assignedOn: '22 Jul 2026, 10:00 AM', completedOn: '23 Jul 2026, 01:00 PM', timeline: [{ timestamp: '23 Jul 2026, 01:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-5', userName: 'Rahul Kumar', project: 'NAM', category: 'Signage', routeSection: 'NAM', routeSectionName: 'N A M Expressway Limited (NAMEL)', subSection: 'Pages 1-24', priority: 'Medium', status: 'Completed', due: '2026-07-22', assignedOn: '20 Jul 2026, 10:00 AM', completedOn: '21 Jul 2026, 04:00 PM', timeline: [{ timestamp: '21 Jul 2026, 04:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-6', userName: 'Rahul Kumar', project: 'NAM', category: 'Signage', routeSection: 'NAM', routeSectionName: 'N A M Expressway Limited (NAMEL)', subSection: 'Pages 25-60', priority: 'Medium', status: 'Completed', due: '2026-07-26', assignedOn: '24 Jul 2026, 10:00 AM', completedOn: '25 Jul 2026, 05:00 PM', timeline: [{ timestamp: '25 Jul 2026, 05:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-7', userName: 'Rahul Kumar', project: 'NAM', category: 'Roadway', routeSection: 'NAM', routeSectionName: 'N A M Expressway Limited (NAMEL)', subSection: 'Pages 61-82', priority: 'Medium', status: 'Completed', due: '2026-07-27', assignedOn: '25 Jul 2026, 10:00 AM', completedOn: '26 Jul 2026, 10:00 AM', timeline: [{ timestamp: '26 Jul 2026, 10:00 AM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-8', userName: 'Rahul Kumar', project: 'APEL', category: 'Structures', routeSection: 'APEL', routeSectionName: 'Andhra Pradesh Expressway Limited (APEL)', subSection: 'Pages 1-13', priority: 'Medium', status: 'Completed', due: '2026-07-28', assignedOn: '26 Jul 2026, 10:00 AM', completedOn: '27 Jul 2026, 11:00 AM', timeline: [{ timestamp: '27 Jul 2026, 11:00 AM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-9', userName: 'Rahul Kumar', project: 'BFHL', category: 'Roadway', routeSection: 'BFHL', routeSectionName: 'Baharampore Farakka Highways Limited(BFHL)', subSection: 'Pages 1-50', priority: 'Medium', status: 'Completed', due: '2026-07-03', assignedOn: '01 Jul 2026, 10:00 AM', completedOn: '02 Jul 2026, 02:00 PM', timeline: [{ timestamp: '02 Jul 2026, 02:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-10', userName: 'Rahul Kumar', project: 'BFHL', category: 'Drainage', routeSection: 'BFHL', routeSectionName: 'Baharampore Farakka Highways Limited(BFHL)', subSection: 'Pages 51-120', priority: 'Medium', status: 'Completed', due: '2026-07-06', assignedOn: '04 Jul 2026, 10:00 AM', completedOn: '05 Jul 2026, 04:00 PM', timeline: [{ timestamp: '05 Jul 2026, 04:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-11', userName: 'Rahul Kumar', project: 'BWHPL', category: 'Roadway', routeSection: 'BWHPL', routeSectionName: 'DBL Borgaon Watambare Highways Private Limited(BWHPL)', subSection: 'Pages 1-60', priority: 'Medium', status: 'Completed', due: '2026-07-10', assignedOn: '08 Jul 2026, 10:00 AM', completedOn: '09 Jul 2026, 12:00 PM', timeline: [{ timestamp: '09 Jul 2026, 12:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-12', userName: 'Rahul Kumar', project: 'BWHPL', category: 'Landscaping', routeSection: 'BWHPL', routeSectionName: 'DBL Borgaon Watambare Highways Private Limited(BWHPL)', subSection: 'Pages 61-150', priority: 'Medium', status: 'Completed', due: '2026-07-13', assignedOn: '11 Jul 2026, 10:00 AM', completedOn: '12 Jul 2026, 03:00 PM', timeline: [{ timestamp: '12 Jul 2026, 03:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-13', userName: 'Rahul Kumar', project: 'DATL', category: 'Structures', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 121-200', priority: 'Medium', status: 'Completed', due: '2026-07-17', assignedOn: '15 Jul 2026, 10:00 AM', completedOn: '16 Jul 2026, 05:00 PM', timeline: [{ timestamp: '16 Jul 2026, 05:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-14', userName: 'Rahul Kumar', project: 'DHMEPL', category: 'Roadway', routeSection: 'DHMEPL', routeSectionName: 'Delhi Hapur Meerut Expressway Private Limited(DHMEPL)', subSection: 'Pages 1-92', priority: 'Medium', status: 'Completed', due: '2026-07-19', assignedOn: '17 Jul 2026, 10:00 AM', completedOn: '18 Jul 2026, 01:00 PM', timeline: [{ timestamp: '18 Jul 2026, 01:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-rahul-15', userName: 'Rahul Kumar', project: 'GAEPL', category: 'Roadway', routeSection: 'GAEPL', routeSectionName: 'Ghaziabad Aligarh Expressway Private Limited(GAEPL)', subSection: 'Pages 1-17', priority: 'Medium', status: 'Completed', due: '2026-07-30', assignedOn: '28 Jul 2026, 10:00 AM', completedOn: '29 Jul 2026, 04:00 PM', timeline: [{ timestamp: '29 Jul 2026, 04:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },

      // --- Sravya Completed Tasks ---
      { id: 't-sravya-1', userName: 'Sravya', project: 'DATL', category: 'Roadway', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 1-15', priority: 'Medium', status: 'Completed', due: '2026-07-22', assignedOn: '20 Jul 2026, 10:00 AM', completedOn: '21 Jul 2026, 10:00 AM', timeline: [{ timestamp: '21 Jul 2026, 10:00 AM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-2', userName: 'Sravya', project: 'DATL', category: 'Drainage', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 16-35', priority: 'Medium', status: 'Completed', due: '2026-07-23', assignedOn: '21 Jul 2026, 10:00 AM', completedOn: '22 Jul 2026, 11:30 AM', timeline: [{ timestamp: '22 Jul 2026, 11:30 AM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-3', userName: 'Sravya', project: 'DATL', category: 'Roadway', routeSection: 'DATL', routeSectionName: 'Delhi Agra Tollway Limited (DATL)', subSection: 'Pages 36-45', priority: 'Medium', status: 'Completed', due: '2026-07-24', assignedOn: '22 Jul 2026, 10:00 AM', completedOn: '23 Jul 2026, 03:00 PM', timeline: [{ timestamp: '23 Jul 2026, 03:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-4', userName: 'Sravya', project: 'APFI', category: 'Structures', routeSection: 'APFI', routeSectionName: 'Andhra Pradesh Expressway Limited (APFI)', subSection: 'Pages 1-25', priority: 'Medium', status: 'Completed', due: '2026-07-25', assignedOn: '23 Jul 2026, 10:00 AM', completedOn: '24 Jul 2026, 12:00 PM', timeline: [{ timestamp: '24 Jul 2026, 12:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-5', userName: 'Sravya', project: 'NAM', category: 'Signage', routeSection: 'NAM', routeSectionName: 'N A M Expressway Limited (NAMEL)', subSection: 'Pages 1-18', priority: 'Medium', status: 'Completed', due: '2026-07-26', assignedOn: '24 Jul 2026, 10:00 AM', completedOn: '25 Jul 2026, 02:00 PM', timeline: [{ timestamp: '25 Jul 2026, 02:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-6', userName: 'Sravya', project: 'NAM', category: 'Roadway', routeSection: 'NAM', routeSectionName: 'N A M Expressway Limited (NAMEL)', subSection: 'Pages 19-30', priority: 'Medium', status: 'Completed', due: '2026-07-27', assignedOn: '25 Jul 2026, 10:00 AM', completedOn: '26 Jul 2026, 03:00 PM', timeline: [{ timestamp: '26 Jul 2026, 03:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-7', userName: 'Sravya', project: 'APEL', category: 'Structures', routeSection: 'APEL', routeSectionName: 'Andhra Pradesh Expressway Limited (APEL)', subSection: 'Pages 1-8', priority: 'Medium', status: 'Completed', due: '2026-07-28', assignedOn: '26 Jul 2026, 10:00 AM', completedOn: '27 Jul 2026, 04:00 PM', timeline: [{ timestamp: '27 Jul 2026, 04:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-8', userName: 'Sravya', project: 'BFHL', category: 'Drainage', routeSection: 'BFHL', routeSectionName: 'Baharampore Farakka Highways Limited(BFHL)', subSection: 'Pages 1-40', priority: 'Medium', status: 'Completed', due: '2026-07-06', assignedOn: '04 Jul 2026, 10:00 AM', completedOn: '05 Jul 2026, 11:00 AM', timeline: [{ timestamp: '05 Jul 2026, 11:00 AM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-9', userName: 'Sravya', project: 'BWHPL', category: 'Roadway', routeSection: 'BWHPL', routeSectionName: 'DBL Borgaon Watambare Highways Private Limited(BWHPL)', subSection: 'Pages 1-50', priority: 'Medium', status: 'Completed', due: '2026-07-13', assignedOn: '11 Jul 2026, 10:00 AM', completedOn: '12 Jul 2026, 12:00 PM', timeline: [{ timestamp: '12 Jul 2026, 12:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-10', userName: 'Sravya', project: 'DHMEPL', category: 'Roadway', routeSection: 'DHMEPL', routeSectionName: 'Delhi Hapur Meerut Expressway Private Limited(DHMEPL)', subSection: 'Pages 1-60', priority: 'Medium', status: 'Completed', due: '2026-07-19', assignedOn: '17 Jul 2026, 10:00 AM', completedOn: '18 Jul 2026, 04:00 PM', timeline: [{ timestamp: '18 Jul 2026, 04:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] },
      { id: 't-sravya-11', userName: 'Sravya', project: 'GAEPL', category: 'Roadway', routeSection: 'GAEPL', routeSectionName: 'Ghaziabad Aligarh Expressway Private Limited(GAEPL)', subSection: 'Pages 1-10', priority: 'Medium', status: 'Completed', due: '2026-07-30', assignedOn: '28 Jul 2026, 10:00 AM', completedOn: '29 Jul 2026, 01:00 PM', timeline: [{ timestamp: '29 Jul 2026, 01:00 PM', action: 'Marked Completed', performedBy: 'Admin', remarks: 'Task completed.' }] }
    ];
    localStorage.setItem('hirate-assignments', JSON.stringify(initialAssignments));
    return initialAssignments;
  });

  // Load actual data from localStorage on mount & listen to updates
  useEffect(() => {
    const loadData = async () => {
      let currentUsers = fallbackUsersList;
      try {
        const fetchedUsers = await workAssignmentService.getUsers();
        if (fetchedUsers && fetchedUsers.length > 0) {
          currentUsers = fetchedUsers;
        }
      } catch (err) {
        console.error('Failed to fetch users from backend, using fallback:', err);
        const savedUsers = localStorage.getItem('hirate-users');
        if (savedUsers) {
          try {
            currentUsers = JSON.parse(savedUsers);
          } catch (e) { }
        }
      }
      setUsersList(currentUsers);
      const savedAssignments = localStorage.getItem('hirate-assignments');
      if (savedAssignments) {
        try {
          setAssignments(JSON.parse(savedAssignments));
        } catch (e) { }
      }
      if (userId) {
        const matchedUser = currentUsers.find(u => u.name.toLowerCase() === userId.toLowerCase()) || {
          name: userId,
          role: 'User',
          manager: 'Arun Kumar',
          status: 'Active'
        };
        setSelectedUser(matchedUser);
        setAppliedUser(matchedUser);
        localStorage.setItem('hirate-selected-user', typeof matchedUser === 'object' ? JSON.stringify(matchedUser) : matchedUser);
      } else {
        const savedSelected = localStorage.getItem('hirate-selected-user');
        if (savedSelected) {
          let parsedSelected = savedSelected;
          try {
            if (savedSelected.trim().startsWith('{')) {
              parsedSelected = JSON.parse(savedSelected);
            }
          } catch (e) { }

          const userName = typeof parsedSelected === 'object' ? parsedSelected.name : parsedSelected;
          const matchedUser = currentUsers.find(u => u.name === userName) ||
            (typeof parsedSelected === 'object' ? parsedSelected : { name: userName, role: 'User', manager: 'Arun Kumar', status: 'Active' });

          setSelectedUser(matchedUser);
          setAppliedUser(matchedUser);
        }
      }
    };

    loadData();

    // Cross-tab: fires when another tab updates localStorage
    window.addEventListener('storage', loadData);
    // Same-tab focus restore (e.g. switching back from notifications)
    window.addEventListener('focus', loadData);
    // Same-tab: fires when Notifications/admin modules dispatch this custom event
    window.addEventListener('hirate-assignments-updated', loadData);

    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('focus', loadData);
      window.removeEventListener('hirate-assignments-updated', loadData);
    };
  }, [userId]);

  const handleApply = () => {
    setAppliedUser(selectedUser);
    setAppliedProject(selectedProject);
    localStorage.setItem('hirate-selected-user', typeof selectedUser === 'object' ? JSON.stringify(selectedUser) : selectedUser);

    // Sync dropdown duration selector
    if (!selectedDuration.includes('→')) {
      if (selectedDuration === 'This Month (July 2026)') {
        setStartDate(new Date(2026, 6, 1));
        setEndDate(new Date(2026, 6, 31));
      } else if (selectedDuration === 'Last Month (June 2026)') {
        setStartDate(new Date(2026, 5, 1));
        setEndDate(new Date(2026, 5, 30));
      } else if (selectedDuration === 'Last 3 Months') {
        setStartDate(new Date(2026, 3, 1));
        setEndDate(new Date(2026, 6, 31));
      } else if (selectedDuration === 'Last 6 Months') {
        setStartDate(new Date(2026, 0, 1));
        setEndDate(new Date(2026, 6, 31));
      } else if (selectedDuration === 'This Year (2026)') {
        setStartDate(new Date(2026, 0, 1));
        setEndDate(new Date(2026, 11, 31));
      }
    }
  };

  // Immediate custom date range selection
  const handleCustomRangeSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    const rangeLabel = `${formatDateLabel(start)} → ${formatDateLabel(end)}`;
    setSelectedDuration(rangeLabel);
  };

  // Find currently applied user object details
  const currentAppliedUserName = appliedUser?.name || appliedUser || '';

  const currentUserObj = usersList.find(u => u.name === currentAppliedUserName) || {
    name: currentAppliedUserName,
    role: appliedUser?.role || (currentAppliedUserName === 'Sravya' ? 'Administrator' : 'User'),
    manager: appliedUser?.manager || 'Arun Kumar',
    status: appliedUser?.status || 'Active'
  };

  // 1. Filter raw database by user, project, and dynamic custom date range
  const filteredRecords = assignments.filter(a => {
    const matchUser = a.userName.toLowerCase() === currentAppliedUserName.toLowerCase();
    const matchProject = appliedProject === 'All Projects' || a.project === appliedProject;

    if (a.status !== 'Completed' || !a.completedOn) return false;

    const recDate = parseFlexibleDate(a.completedOn);
    const matchDate = recDate >= startDate && recDate <= endDate;
    return matchUser && matchProject && matchDate;
  });

  const allAssignedRecords = assignments.filter(a => {
    const matchUser = a.userName.toLowerCase() === currentAppliedUserName.toLowerCase();
    const matchProject = appliedProject === 'All Projects' || a.project === appliedProject;

    const dateStr = a.completedOn || a.assignedOn || '';
    const recDate = parseFlexibleDate(dateStr);
    const matchDate = recDate >= startDate && recDate <= endDate;
    return matchUser && matchProject && matchDate;
  });

  const userAssignments = assignments.filter(a => a.userName.toLowerCase() === currentAppliedUserName.toLowerCase());

  // Determine active records based on priority fallback logic
  const hasFilteredCompleted = filteredRecords.length > 0;
  const hasFilteredAssigned = allAssignedRecords.length > 0;

  let activeRecords = [];
  let isUsingCompleted = false;

  if (hasFilteredCompleted) {
    activeRecords = filteredRecords;
    isUsingCompleted = true;
  } else if (hasFilteredAssigned) {
    activeRecords = allAssignedRecords;
    isUsingCompleted = false;
  } else if (userAssignments.length > 0) {
    // If user has completed tasks anywhere, fall back to those first
    const userCompleted = userAssignments.filter(a => a.status === 'Completed');
    if (userCompleted.length > 0) {
      activeRecords = userCompleted;
      isUsingCompleted = true;
    } else {
      activeRecords = userAssignments;
      isUsingCompleted = false;
    }
  }

  // --- DYNAMIC WEEKLY RANGE BUILDER ---
  const getWeeklyDaysRange = (start, end) => {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const count = Math.min(diffDays, 7);

    const days = [];
    for (let i = 0; i < count; i++) {
      const nextDate = new Date(start);
      nextDate.setDate(start.getDate() + i);
      const label = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
      const subLabel = nextDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const dateStr = formatDateLabel(nextDate);
      days.push({ key: label, dateStr, label, subLabel });
    }
    return days;
  };

  const chartWeeklyDays = getWeeklyDaysRange(startDate, endDate);
  const chartWeeklyData = chartWeeklyDays.map(day => {
    const records = activeRecords.filter(r => {
      const dateToUse = isUsingCompleted ? r.completedOn : (r.assignedOn || r.completedOn);
      const compDate = parseFlexibleDate(dateToUse);
      const dayDate = parseFlexibleDate(day.dateStr);
      return compDate.getFullYear() === dayDate.getFullYear() &&
        compDate.getMonth() === dayDate.getMonth() &&
        compDate.getDate() === dayDate.getDate();
    });
    const sum = records.reduce((acc, r) => {
      const isCompletedItem = r.status === 'Completed';
      const pCount = (isCompletedItem || !isUsingCompleted) ? parsePagesFromRange(r.subSection || r.pageRange || '') : 0;
      return acc + pCount;
    }, 0);
    return {
      name: day.label,
      subName: day.subLabel,
      pages: sum,
      date: day.dateStr
    };
  });

  const totalWeeklyPages = chartWeeklyData.reduce((acc, d) => acc + d.pages, 0);
  const weeklyDaysWorked = chartWeeklyData.filter(d => d.pages > 0).length || 1;
  const weeklyDailyAverage = (totalWeeklyPages / weeklyDaysWorked).toFixed(1);

  // --- DYNAMIC MONTHLY SEGMENT SPLITTER (Quarters) ---
  const getMonthlyWeeksRange = (start, end) => {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 4) {
      const weeks = [];
      for (let i = 0; i < diffDays; i++) {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i);
        const label = nextDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        weeks.push({ id: i + 1, label, dateRange: '', start: new Date(nextDate), end: new Date(nextDate) });
      }
      return weeks;
    }

    const segmentSize = Math.ceil(diffDays / 4) || 1;
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const wStart = new Date(start);
      wStart.setDate(start.getDate() + i * segmentSize);

      const wEnd = new Date(start);
      wEnd.setDate(start.getDate() + (i + 1) * segmentSize - 1);
      if (wEnd > end) wEnd.setTime(end.getTime());

      const label = `Week ${i + 1}`;
      const dateRange = `(${wStart.getDate()}-${wEnd.getDate()} ${wStart.toLocaleDateString('en-US', { month: 'short' })})`;
      weeks.push({ id: i + 1, label, dateRange, start: new Date(wStart), end: new Date(wEnd) });
    }
    return weeks;
  };

  const chartMonthlyWeeksConfig = getMonthlyWeeksRange(startDate, endDate);
  const chartMonthlyData = chartMonthlyWeeksConfig.map(wc => {
    const records = activeRecords.filter(r => {
      const dateToUse = isUsingCompleted ? r.completedOn : (r.assignedOn || r.completedOn);
      const compDate = parseFlexibleDate(dateToUse);
      return compDate >= wc.start && compDate <= wc.end;
    });
    const sum = records.reduce((acc, r) => {
      const isCompletedItem = r.status === 'Completed';
      const pCount = (isCompletedItem || !isUsingCompleted) ? parsePagesFromRange(r.subSection || r.pageRange || '') : 0;
      return acc + pCount;
    }, 0);
    return {
      name: wc.label,
      subName: wc.dateRange,
      pages: sum,
      date: `${wc.label} ${wc.dateRange}`
    };
  });

  const totalMonthlyPages = chartMonthlyData.reduce((acc, d) => acc + d.pages, 0);

  // Calculate Monthly Days Worked (distinct days within range where user completed pages)
  const monthlyCompletedDays = new Set(
    activeRecords.map(r => {
      const dateToUse = isUsingCompleted ? r.completedOn : (r.assignedOn || r.completedOn);
      const compDate = parseFlexibleDate(dateToUse);
      return `${compDate.getFullYear()}-${compDate.getMonth()}-${compDate.getDate()}`;
    })
  );
  const monthlyDaysWorked = monthlyCompletedDays.size || 1;
  const monthlyDailyAverage = (totalMonthlyPages / monthlyDaysWorked).toFixed(1);

  const generateExcelXML = () => {
    const totalPagesAssigned = activeRecords.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
    const completedRecs = activeRecords.filter(r => r.status === 'Completed');
    const totalPagesCompleted = completedRecs.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
    const completionPercentage = totalPagesAssigned > 0 ? Math.round((totalPagesCompleted / totalPagesAssigned) * 100) : 0;
    const uniqueProjectsCount = [...new Set(activeRecords.map(r => r.routeSection || r.project).filter(Boolean))].length;

    const projSummary = {};
    activeRecords.forEach(r => {
      const p = r.routeSection || r.project;
      if (p) {
        projSummary[p] = (projSummary[p] || 0) + parsePagesFromRange(r.subSection || r.pageRange || '');
      }
    });

    const catSummary = {};
    activeRecords.forEach(r => {
      const c = categoryMap[r.category] || r.category;
      if (c) {
        catSummary[c] = (catSummary[c] || 0) + parsePagesFromRange(r.subSection || r.pageRange || '');
      }
    });

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#2E7D32"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#2E7D32" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="BoldLabel">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#333333"/>
    </Style>
  </Styles>
  
  <Worksheet ss:Name="User Summary">
    <Table ss:ExpandedColumnCount="4">
      <Row ss:Height="24">
        <Cell><Data ss:Type="String">USER SUMMARY REPORT</Data></Cell>
      </Row>
      <Row><Cell/></Row>
      <Row>
        <Cell><Data ss:Type="String">User Name:</Data></Cell>
        <Cell><Data ss:Type="String">${currentUserObj?.name}</Data></Cell>
        <Cell><Data ss:Type="String">Role:</Data></Cell>
        <Cell><Data ss:Type="String">${currentUserObj?.role}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Reporting Manager:</Data></Cell>
        <Cell><Data ss:Type="String">${currentUserObj?.manager}</Data></Cell>
        <Cell><Data ss:Type="String">Report Duration:</Data></Cell>
        <Cell><Data ss:Type="String">${selectedDuration}</Data></Cell>
      </Row>
      <Row><Cell/></Row>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Metric</Data></Cell>
        <Cell><Data ss:Type="String">Value</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Projects</Data></Cell>
        <Cell><Data ss:Type="Number">${uniqueProjectsCount}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Pages Assigned</Data></Cell>
        <Cell><Data ss:Type="Number">${totalPagesAssigned}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Pages Completed</Data></Cell>
        <Cell><Data ss:Type="Number">${totalPagesCompleted}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Completion Percentage</Data></Cell>
        <Cell><Data ss:Type="String">${completionPercentage}%</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
  
  <Worksheet ss:Name="Work History">
    <Table ss:ExpandedColumnCount="7">
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Project</Data></Cell>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Page Range</Data></Cell>
        <Cell><Data ss:Type="String">Pages Completed</Data></Cell>
        <Cell><Data ss:Type="String">Assigned By</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
      </Row>`;

    activeRecords.forEach(r => {
      const dateVal = r.completedOn || r.assignedOn || '';
      const projVal = r.routeSection || r.project || '';
      const catVal = categoryMap[r.category] || r.category || '';
      const rangeVal = r.subSection || r.pageRange || 'N/A';
      const pagesVal = r.status === 'Completed' ? parsePagesFromRange(r.subSection || r.pageRange || '') : 0;
      const assignedBy = r.timeline && r.timeline[0] ? r.timeline[0].performedBy : 'Admin';
      const statusVal = (r.status || 'Assigned').toUpperCase();

      xml += `
      <Row>
        <Cell><Data ss:Type="String">${dateVal}</Data></Cell>
        <Cell><Data ss:Type="String">${projVal}</Data></Cell>
        <Cell><Data ss:Type="String">${catVal}</Data></Cell>
        <Cell><Data ss:Type="String">${rangeVal}</Data></Cell>
        <Cell><Data ss:Type="Number">${pagesVal}</Data></Cell>
        <Cell><Data ss:Type="String">${assignedBy}</Data></Cell>
        <Cell><Data ss:Type="String">${statusVal}</Data></Cell>
      </Row>`;
    });

    xml += `
    </Table>
  </Worksheet>
  
  <Worksheet ss:Name="Project Summary">
    <Table ss:ExpandedColumnCount="2">
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Project Name</Data></Cell>
        <Cell><Data ss:Type="String">Total Pages</Data></Cell>
      </Row>`;

    Object.entries(projSummary).forEach(([proj, val]) => {
      xml += `
      <Row>
        <Cell><Data ss:Type="String">${proj}</Data></Cell>
        <Cell><Data ss:Type="Number">${val}</Data></Cell>
      </Row>`;
    });

    xml += `
    </Table>
  </Worksheet>
  
  <Worksheet ss:Name="Category Summary">
    <Table ss:ExpandedColumnCount="2">
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Category Name</Data></Cell>
        <Cell><Data ss:Type="String">Total Pages</Data></Cell>
      </Row>`;

    Object.entries(catSummary).forEach(([cat, val]) => {
      xml += `
      <Row>
        <Cell><Data ss:Type="String">${cat}</Data></Cell>
        <Cell><Data ss:Type="Number">${val}</Data></Cell>
      </Row>`;
    });

    xml += `
    </Table>
  </Worksheet>
</Workbook>`;
    return xml;
  };

  const handleExcelExport = () => {
    const xmlContent = generateExcelXML();
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentAppliedUserName}_Insights_Report.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessToast("Report downloaded successfully");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const handlePDFExport = () => {
    const totalPagesAssigned = activeRecords.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
    const completedRecs = activeRecords.filter(r => r.status === 'Completed');
    const totalPagesCompleted = completedRecs.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
    const completionPercentage = totalPagesAssigned > 0 ? Math.round((totalPagesCompleted / totalPagesAssigned) * 100) : 0;
    const uniqueProjectsCount = [...new Set(activeRecords.map(r => r.routeSection || r.project).filter(Boolean))].length;

    const historyRows = activeRecords.map(r => {
      const dateStr = r.completedOn || r.assignedOn || '';
      const compDate = parseFlexibleDate(dateStr);
      const dateVal = formatDateLabelShort(compDate);
      const projVal = r.routeSection || r.project || '';
      const catVal = categoryMap[r.category] || r.category || '';
      const rangeVal = r.subSection || r.pageRange || 'N/A';
      const pagesVal = parsePagesFromRange(r.subSection || r.pageRange || '');
      const assignedBy = r.timeline && r.timeline[0] ? r.timeline[0].performedBy : 'Admin';
      const statusVal = (r.status || 'Assigned').toUpperCase();

      const badgeStyle = statusVal === 'COMPLETED'
        ? 'background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;'
        : statusVal === 'IN PROGRESS'
          ? 'background: #fffbeb; color: #d97706; border: 1px solid #fde68a;'
          : statusVal === 'REJECTED'
            ? 'background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;'
            : 'background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;';

      return `
        <tr>
          <td>${dateVal}</td>
          <td style="font-weight: bold; color: #2E7D32;">${projVal}</td>
          <td>${catVal}</td>
          <td>${rangeVal}</td>
          <td>${pagesVal} Pages</td>
          <td>${assignedBy}</td>
          <td>
            <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; ${badgeStyle}">
              ${statusVal}
            </span>
          </td>  ,,lllofpopk
        </tr>
      `;
    }).join('');

    const projSummary = {};
    activeRecords.forEach(r => {
      const p = r.routeSection || r.project;
      if (p) {
        projSummary[p] = (projSummary[p] || 0) + parsePagesFromRange(r.subSection || r.pageRange || '');
      }
    });
    const maxProjVal = Math.max(...Object.values(projSummary), 1);
    const projBars = Object.entries(projSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
            <span>${name}</span>
            <span>${val} Pages</span>
          </div>
          <div style="width: 100%; background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #2E7D32; height: 100%; width: ${(val / maxProjVal) * 100}%;"></div>
          </div>
        </div>
      `).join('');

    const catSummary = {};
    activeRecords.forEach(r => {
      const c = categoryMap[r.category] || r.category;
      if (c) {
        catSummary[c] = (catSummary[c] || 0) + parsePagesFromRange(r.subSection || r.pageRange || '');
      }
    });
    const maxCatVal = Math.max(...Object.values(catSummary), 1);
    const catBars = Object.entries(catSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
            <span>${name}</span>
            <span>${val} Pages</span>
          </div>
          <div style="width: 100%; background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #2563eb; height: 100%; width: ${(val / maxCatVal) * 100}%;"></div>
          </div>
        </div>
      `).join('');

    const maxWeekVal = Math.max(...chartWeeklyData.map(d => d.pages), 1);
    const weeklyBars = chartWeeklyData.map(d => `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 2px;">
          <span>${d.name} (${d.subName})</span>
          <span>${d.pages} Pages</span>
        </div>
        <div style="width: 100%; background: #f3f4f6; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="background: #a855f7; height: 100%; width: ${(d.pages / maxWeekVal) * 100}%;"></div>
        </div>
      </div>
    `).join('');

    const maxMonthVal = Math.max(...chartMonthlyData.map(d => d.pages), 1);
    const monthlyBars = chartMonthlyData.map(d => `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 2px;">
          <span>${d.name} ${d.subName}</span>
          <span>${d.pages} Pages</span>
        </div>
        <div style="width: 100%; background: #f3f4f6; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="background: #14b8a6; height: 100%; width: ${(d.pages / maxMonthVal) * 100}%;"></div>
        </div>
      </div>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>User Insights Report - ${currentUserObj?.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #374151; padding: 40px; line-height: 1.5; background: #ffffff; }
            .header-container { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #2E7D32; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 900; color: #2E7D32; letter-spacing: 0.05em; }
            .logo span { color: #1e3a8a; }
            .meta-info { text-align: right; font-size: 12px; color: #6b7280; font-weight: 500; }
            .meta-info span { color: #111827; font-weight: 700; }
            h2 { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; color: #111827; page-break-inside: avoid; }
            .grid-kpi { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .kpi-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #f9fafb; text-align: center; }
            .kpi-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; }
            .kpi-value { font-size: 18px; font-weight: 900; color: #111827; margin-top: 4px; }
            .grid-charts { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; page-break-inside: avoid; }
            .chart-card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
            th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 10px 12px; text-align: left; font-weight: bold; color: #4b5563; }
            td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
            .timeline-container { display: flex; flex-direction: column; gap: 15px; margin-left: 10px; border-left: 2px solid #e5e7eb; padding-left: 20px; page-break-inside: avoid; }
            .timeline-item { position: relative; }
            .timeline-dot { position: absolute; left: -27px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #2E7D32; }
            .timeline-title { font-size: 13px; font-weight: bold; color: #111827; }
            .timeline-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="logo">Hi<span>RATE</span></div>
              <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-top: 4px;">Highway Infrastructure Rating & Assessment Tool</div>
            </div>
            <div class="meta-info">
              <div>User Name: <span>${currentUserObj?.name}</span></div>
              <div>Role: <span>${currentUserObj?.role}</span></div>
              <div>Reporting Manager: <span>${currentUserObj?.manager}</span></div>
              <div>Duration: <span>${selectedDuration}</span></div>
            </div>
          </div>
          
          <h2>User Summary</h2>
          <div class="grid-kpi">
            <div class="kpi-card">
              <div class="kpi-title">Total Projects</div>
              <div class="kpi-value">${uniqueProjectsCount}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Pages Assigned</div>
              <div class="kpi-value">${totalPagesAssigned}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Pages Completed</div>
              <div class="kpi-value">${totalPagesCompleted}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Completion Percentage</div>
              <div class="kpi-value">${completionPercentage}%</div>
            </div>
          </div>
          
          <div class="grid-charts">
            <div class="chart-card">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 12px;">Weekly Pages Completed</div>
              ${weeklyBars || '<div style="font-size: 11px; color: #9ca3af;">No Data Available</div>'}
            </div>
            <div class="chart-card">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 12px;">Monthly Pages Completed</div>
              ${monthlyBars || '<div style="font-size: 11px; color: #9ca3af;">No Data Available</div>'}
            </div>
          </div>

          <div class="grid-charts">
            <div class="chart-card">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 12px;">Project-wise Summary</div>
              ${projBars || '<div style="font-size: 11px; color: #9ca3af;">No Data Available</div>'}
            </div>
            <div class="chart-card">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 12px;">Category-wise Summary</div>
              ${catBars || '<div style="font-size: 11px; color: #9ca3af;">No Data Available</div>'}
            </div>
          </div>
          
          <h2>Work History Table</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Category</th>
                <th>Page Range</th>
                <th>Pages Completed</th>
                <th>Assigned By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows || '<tr><td colspan="7" style="text-align: center; color: #9ca3af;">No records found.</td></tr>'}
            </tbody>
          </table>
          
          <h2>Activity Timeline</h2>
          <div class="timeline-container">
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-title">Assignments Registered</div>
              <div class="timeline-desc">Total of ${totalPagesAssigned} pages assigned for visual rating.</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot" style="background: #2563eb;"></div>
              <div class="timeline-title">Inspection Progress</div>
              <div class="timeline-desc">${totalPagesCompleted} of ${totalPagesAssigned} pages have been rated and completed.</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot" style="background: #a855f7;"></div>
              <div class="timeline-title">Compliance Evaluation</div>
              <div class="timeline-desc">Evaluation score generated for all active projects.</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    setSuccessToast("Report downloaded successfully");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // --- DOUGHNUT CHART PROJECT GROUPS & HORIZONTAL BAR DATA ---
  // Get all assignments for the selected user, ignoring project/category filters
  const userAllRecords = assignments.filter(a => a.userName.toLowerCase() === currentAppliedUserName.toLowerCase());

  // 1. Group records by project (ignoring HO PROCESS / status labels)
  const projectRecordsMap = {};
  userAllRecords.forEach(r => {
    const projName = r.routeSection || r.project;
    if (projName &&
      projName !== 'HO PROCESS' &&
      projName !== 'ON-GOING' &&
      projName !== 'SPV RATED' &&
      projName !== 'HO RATED' &&
      projName !== 'NOT RATED') {
      if (!projectRecordsMap[projName]) {
        projectRecordsMap[projName] = [];
      }
      projectRecordsMap[projName].push(r);
    }
  });

  // 2. Aggregate pages per project: completed pages preferred, assigned pages fallback
  const chartProjectGroups = {};
  Object.entries(projectRecordsMap).forEach(([projName, records]) => {
    const completed = records.filter(r => r.status === 'Completed');
    if (completed.length > 0) {
      const sumCompleted = completed.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
      chartProjectGroups[projName] = sumCompleted;
    } else {
      const sumAssigned = records.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
      chartProjectGroups[projName] = sumAssigned;
    }
  });

  // 3. Map to pieData (Monthly Project Summary donut chart)
  const pieData = Object.entries(chartProjectGroups)
    .filter(([, val]) => val > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([proj, val]) => {
      const totalSum = Object.values(chartProjectGroups).reduce((s, v) => s + v, 0) || 1;
      const pct = ((val / totalSum) * 100).toFixed(1);
      return {
        name: proj,
        value: val,
        percentage: pct,
        color: getProjectColor(proj)
      };
    });

  // 4. Map to projectWiseData sorted descending and filtered for > 0 pages
  const projectWiseData = Object.entries(chartProjectGroups)
    .map(([proj, val]) => ({ name: proj, pages: val, color: getProjectColor(proj) }))
    .filter(item => item.pages > 0)
    .sort((a, b) => b.pages - a.pages);

  // --- CATEGORY-WISE HORIZONTAL BAR DATA ---
  // 1. Group records by category (using mapped category name)
  const categoryRecordsMap = {};
  userAllRecords.forEach(r => {
    const mappedCat = categoryMap[r.category] || r.category;
    if (mappedCat) {
      if (!categoryRecordsMap[mappedCat]) {
        categoryRecordsMap[mappedCat] = [];
      }
      categoryRecordsMap[mappedCat].push(r);
    }
  });

  // 2. Aggregate pages per category: completed pages preferred, assigned pages fallback
  const chartCategoryGroups = {};
  Object.entries(categoryRecordsMap).forEach(([catName, records]) => {
    const completed = records.filter(r => r.status === 'Completed');
    if (completed.length > 0) {
      const sumCompleted = completed.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
      chartCategoryGroups[catName] = sumCompleted;
    } else {
      const sumAssigned = records.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
      chartCategoryGroups[catName] = sumAssigned;
    }
  });

  // 3. Map to categoryWiseData sorted descending and filtered for > 0 pages
  const categoryWiseData = Object.entries(chartCategoryGroups)
    .map(([cat, val]) => ({ name: cat, pages: val, color: getCategoryColor(cat) }))
    .filter(item => item.pages > 0)
    .sort((a, b) => b.pages - a.pages);

  // Total pages shown in the donut center — matches chartProjectGroups (not date-filtered)
  const chartTotalPages = Object.values(chartProjectGroups).reduce((s, v) => s + v, 0);


  const formatDateLabelShort = (d) => {
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formattedWorkHistory = activeRecords.map(item => {
    const dateToUse = isUsingCompleted ? item.completedOn : (item.assignedOn || item.completedOn);
    const compDate = parseFlexibleDate(dateToUse);
    const dateFormatted = formatDateLabelShort(compDate);

    const isCompleted = item.status === 'Completed';
    const pagesVal = parsePagesFromRange(item.subSection || item.pageRange || '');
    const statusText = item.status || 'Assigned';
    const assignedBy = item.timeline && item.timeline[0] ? item.timeline[0].performedBy : 'Admin';

    return {
      date: dateFormatted,
      project: item.routeSection || item.project,
      category: categoryMap[item.category] || item.category,
      pageRange: item.subSection || item.pageRange || 'N/A',
      pagesAssigned: pagesVal,
      assignedBy: assignedBy,
      status: statusText
    };
  });

  const [tablePage, setTablePage] = useState(1);
  const TABLE_ITEMS_PER_PAGE = 5;
  const totalTablePages = Math.ceil(formattedWorkHistory.length / TABLE_ITEMS_PER_PAGE) || 1;
  const paginatedTableData = formattedWorkHistory.slice(
    (tablePage - 1) * TABLE_ITEMS_PER_PAGE,
    tablePage * TABLE_ITEMS_PER_PAGE
  );

  // Horizontal Bar Tick Custom Renderers
  const CustomProjectYTick = ({ x, y, payload }) => {
    const color = getProjectColor(payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* Render custom road shield icon */}
        <g transform="translate(-72, -10) scale(0.6)">
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <text x={-52} y={0} textAnchor="start" fill="#374151" className="text-xs font-bold">
          {payload.value}
        </text>
      </g>
    );
  };

  const CustomCategoryYTick = ({ x, y, payload }) => {
    const color = getCategoryColor(payload.value);
    const cat = payload.value || '';

    const getCategoryDisplayLabel = (val) => {
      if (!val) return '';
      const cleanVal = val.trim();
      if (cleanVal === 'Road Signage and Furniture' || cleanVal === 'Road Signage & Furniture') {
        return 'Signage & Furniture';
      }
      if (cleanVal === 'Project Facilities' || cleanVal === 'Facilities') {
        return 'Facilities';
      }
      if (cleanVal === 'Advanced Traffic Management System') {
        return 'ATMS';
      }
      if (cleanVal === 'Traffic Management System') {
        return 'TMS';
      }
      return cleanVal;
    };

    let iconSvg = null;
    if (cat.toLowerCase().includes('roadway')) {
      iconSvg = (
        <path d="M4 22L10 2M20 22L14 2M12 22v-4M12 14v-4M12 6V2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      );
    } else if (cat.toLowerCase().includes('drainage') || cat.toLowerCase().includes('facility') || cat.toLowerCase().includes('facilities')) {
      iconSvg = (
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      );
    } else if (cat.toLowerCase().includes('structure')) {
      iconSvg = (
        <path d="M3 20h18M3 12a9 9 0 0 1 18 0M6 12v8M18 12v8M12 3v9" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      );
    } else if (cat.toLowerCase().includes('signage') || cat.toLowerCase().includes('furniture')) {
      iconSvg = (
        <path d="M4 15h11a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2zM17 22V10M7 22v-7" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      );
    } else if (cat.toLowerCase().includes('atms')) {
      iconSvg = (
        <g>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="none" stroke={color} strokeWidth="2.5" />
          <circle cx="12" cy="13" r="4" fill="none" stroke={color} strokeWidth="2.5" />
        </g>
      );
    } else if (cat.toLowerCase().includes('tms')) {
      iconSvg = (
        <path d="M2 10h20M7 10V4a2 2 0 0 1 4 0v6M13 10V6a2 2 0 0 1 4 0v4M4 21h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" fill="none" stroke={color} strokeWidth="2.5" />
      );
    } else {
      iconSvg = (
        <path d="M12 22V12M12 12a6 6 0 0 1 6-6h-6M12 12a6 6 0 0 0-6-6h6" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        {/* Category icon left-aligned at -115px */}
        <g transform="translate(-115, -10) scale(0.6)">
          {iconSvg}
        </g>
        {/* Category display name left-aligned at -95px */}
        <text x={-95} y={3} textAnchor="start" fill="#374151" className="text-[10px] font-bold tracking-tight">
          {getCategoryDisplayLabel(payload.value)}
        </text>
      </g>
    );
  };

  const renderHorizontalBarLabel = ({ x, y, width, height, value }) => {
    if (value === 0) return null;
    return (
      <text
        x={x + width + 10}
        y={y + height / 2 + 4}
        fill="#374151"
        className="text-xs font-extrabold"
        textAnchor="start"
      >
        {value}
      </text>
    );
  };

  // --- CALENDAR TIMELINE BUSINESS LOGIC ---
  const getDayActivityDetails = (dayNum) => {
    const formattedDay = dayNum.toString().padStart(2, '0');
    const targetMonthName = currentMonthYear.split(' ')[0]; // e.g. "July"
    const targetYear = currentMonthYear.split(' ')[1]; // e.g. "2026"

    const dayRecords = filteredRecords.filter(r => {
      const compDate = parseFlexibleDate(r.completedOn);
      const mNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const compMonthName = mNames[compDate.getMonth()];

      return compDate.getDate() === dayNum &&
        compMonthName.toLowerCase() === targetMonthName.toLowerCase() &&
        compDate.getFullYear().toString() === targetYear;
    });

    const weekday = getWeekdayLabel(dayNum, currentMonthYear);
    const dateStr = `${formattedDay} ${targetMonthName.slice(0, 3)} ${targetYear}`;

    if (dayRecords.length === 0) {
      return {
        hasActivity: false,
        dateStr: dateStr,
        project: 'N/A',
        category: 'N/A',
        pageRange: 'N/A',
        pagesCompleted: 0,
        weekday
      };
    }

    const projects = [...new Set(dayRecords.map(r => r.project))].join(', ');
    const categories = [...new Set(dayRecords.map(r => r.category))].join(', ');
    const totalCompleted = dayRecords.reduce((sum, r) => sum + parsePagesFromRange(r.subSection || r.pageRange || ''), 0);
    const pageRanges = dayRecords.map(r => r.subSection || r.pageRange).filter(Boolean).join(', ') || 'N/A';

    return {
      hasActivity: true,
      dateStr: dateStr,
      project: projects,
      category: categories,
      pageRange: pageRanges,
      pagesCompleted: totalCompleted,
      weekday
    };
  };

  const getWeekdayLabel = (dayNum, monthYearStr) => {
    const monthMap = { 'June': 5, 'July': 6, 'August': 7 };
    const mStr = monthYearStr.split(' ')[0];
    const monthIdx = monthMap[mStr] !== undefined ? monthMap[mStr] : 6;
    const year = parseInt(monthYearStr.split(' ')[1], 10) || 2026;
    const d = new Date(year, monthIdx, dayNum);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDaysInMonthCount = (monthYearStr) => {
    const monthMap = { 'June': 5, 'July': 6, 'August': 7 };
    const mStr = monthYearStr.split(' ')[0];
    const monthIdx = monthMap[mStr] !== undefined ? monthMap[mStr] : 6;
    const year = parseInt(monthYearStr.split(' ')[1], 10) || 2026;
    return new Date(year, monthIdx + 1, 0).getDate();
  };

  const daysInMonthCount = getDaysInMonthCount(currentMonthYear);
  const daysList = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    if (currentMonthYear === 'July 2026') setCurrentMonthYear('June 2026');
    else if (currentMonthYear === 'August 2026') setCurrentMonthYear('July 2026');
  };

  const handleNextMonth = () => {
    if (currentMonthYear === 'July 2026') setCurrentMonthYear('August 2026');
    else if (currentMonthYear === 'June 2026') setCurrentMonthYear('July 2026');
  };

  // Tabs navigation configuration
  const tabs = [
    { id: 'Overview', label: 'Overview', icon: MdOutlineDashboard },
    { id: 'Work History', label: 'Work History', icon: MdOutlineHistory },
    { id: 'Weekly Report', label: 'Weekly Report', icon: MdOutlineCalendarToday },
    { id: 'Monthly Report', label: 'Monthly Report', icon: MdOutlineDateRange },
    { id: 'Project Summary', label: 'Project Summary', icon: MdOutlineAssessment },
    { id: 'Activity Timeline', label: 'Activity Timeline', icon: MdOutlineAccessTime }
  ];

  // Dynamic Tab Content Router
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="flex flex-col gap-6 w-full">
            <UserProfileSummaryCard currentUserObj={currentUserObj} assignments={assignments} parsePagesFromRange={parsePagesFromRange} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch">
              <WeeklyReportCard
                chartWeeklyData={chartWeeklyData}
                totalWeeklyPages={totalWeeklyPages}
                weeklyDailyAverage={weeklyDailyAverage}
                startDate={startDate}
                endDate={endDate}
                handleCustomRangeSelect={handleCustomRangeSelect}
              />
              <MonthlyReportCard
                chartMonthlyData={chartMonthlyData}
                totalMonthlyPages={totalMonthlyPages}
                monthlyDailyAverage={monthlyDailyAverage}
                startDate={startDate}
                endDate={endDate}
                handleCustomRangeSelect={handleCustomRangeSelect}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[70fr_30fr] gap-6 w-full items-stretch">
              <WorkHistoryTableCard
                paginatedTableData={paginatedTableData}
                formattedWorkHistory={formattedWorkHistory}
                tablePage={tablePage}
                setTablePage={setTablePage}
                TABLE_ITEMS_PER_PAGE={TABLE_ITEMS_PER_PAGE}
                totalTablePages={totalTablePages}
              />
              <MonthlyProjectSummaryCard
                pieData={pieData}
                totalMonthlyPages={chartTotalPages}
              />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-stretch">
              <ProjectWiseChartCard projectWiseData={projectWiseData} CustomProjectYTick={CustomProjectYTick} renderHorizontalBarLabel={renderHorizontalBarLabel} />
              <CategoryWiseChartCard categoryWiseData={categoryWiseData} CustomCategoryYTick={CustomCategoryYTick} renderHorizontalBarLabel={renderHorizontalBarLabel} />
              <ActivityTimelineCard
                currentMonthYear={currentMonthYear}
                handlePrevMonth={handlePrevMonth}
                handleNextMonth={handleNextMonth}
                hoveredDay={hoveredDay}
                setHoveredDay={setHoveredDay}
                daysList={daysList}
                getDayActivityDetails={getDayActivityDetails}
                isCompletedMode={isUsingCompleted}
              />
            </div>
          </div>
        );
      case 'Work History':
        return (
          <WorkHistoryTableCard
            paginatedTableData={paginatedTableData}
            formattedWorkHistory={formattedWorkHistory}
            tablePage={tablePage}
            setTablePage={setTablePage}
            TABLE_ITEMS_PER_PAGE={TABLE_ITEMS_PER_PAGE}
            totalTablePages={totalTablePages}
          />
        );
      case 'Weekly Report':
        return (
          <WeeklyReportCard
            chartWeeklyData={chartWeeklyData}
            totalWeeklyPages={totalWeeklyPages}
            weeklyDailyAverage={weeklyDailyAverage}
            fullWidth
            startDate={startDate}
            endDate={endDate}
            handleCustomRangeSelect={handleCustomRangeSelect}
          />
        );
      case 'Monthly Report':
        return (
          <MonthlyReportCard
            chartMonthlyData={chartMonthlyData}
            totalMonthlyPages={totalMonthlyPages}
            monthlyDailyAverage={monthlyDailyAverage}
            fullWidth
            startDate={startDate}
            endDate={endDate}
            handleCustomRangeSelect={handleCustomRangeSelect}
          />
        );
      case 'Project Summary':
        return (
          <div className="flex flex-col gap-6 w-full">
            <MonthlyProjectSummaryCard
              pieData={pieData}
              totalMonthlyPages={chartTotalPages}
              fullWidth
            />
            <ProjectWiseChartCard
              projectWiseData={projectWiseData}
              CustomProjectYTick={CustomProjectYTick}
              renderHorizontalBarLabel={renderHorizontalBarLabel}
              height="420px"
            />
          </div>
        );
      case 'Activity Timeline':
        return (
          <ActivityTimelineCard
            currentMonthYear={currentMonthYear}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            hoveredDay={hoveredDay}
            setHoveredDay={setHoveredDay}
            daysList={daysList}
            getDayActivityDetails={getDayActivityDetails}
            fullWidth
            isCompletedMode={isUsingCompleted}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pageBg">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white p-8 pt-6 relative">
          <div className="max-w-[1800px] mx-auto w-full space-y-6">

            {activeReportProject ? (
              <DetailedProjectReportView
                projectName={activeReportProject}
                userAssignments={assignments.filter(a => a.userName.toLowerCase() === currentAppliedUserName.toLowerCase())}
                currentUserObj={currentUserObj}
                onClose={() => setActiveReportProject(null)}
                CustomCategoryYTick={CustomCategoryYTick}
                renderHorizontalBarLabel={renderHorizontalBarLabel}
              />
            ) : (
              <>
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pb-6 border-b border-borderColor">
                  {/* Left Column: Title & Breadcrumbs */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <h1 className="text-[28px] font-bold text-textColor leading-tight">User Insights</h1>
                    <nav className="flex items-center gap-1.5 text-sm text-muted">
                      <span className="hover:text-primary transition-colors cursor-pointer">Dashboard</span>
                      <span className="text-gray-400 text-xs font-normal">&gt;</span>
                      <span className="hover:text-primary transition-colors cursor-pointer">User Insights</span>
                      <span className="text-gray-400 text-xs font-normal">&gt;</span>
                      <span className="text-green-600 font-semibold">{appliedUser?.name || appliedUser}</span>
                    </nav>
                  </div>

                  {/* Right Column: Filters */}
                  <div className="flex flex-wrap items-end gap-4 xl:justify-end w-full xl:w-auto">
                    {/* User Select */}
                    <div className="flex flex-col gap-1.5 min-w-[160px] flex-1 sm:flex-initial">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</label>
                      <div className="relative">
                        <select
                          value={selectedUser?.name || selectedUser}
                          onChange={(e) => {
                            const foundUser = usersList.find(u => u.name === e.target.value);
                            setSelectedUser(foundUser || { name: e.target.value, role: 'User', manager: 'Arun Kumar', status: 'Active' });
                          }}
                          className="w-full h-[46px] pl-4 pr-10 border border-borderColor rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-textColor font-bold appearance-none cursor-pointer shadow-sm transition-all duration-200"
                        >
                          {usersList.map((user) => (
                            <option key={user.name || user.email} value={user.name}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                          <MdExpandMore className="text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Project Select */}
                    <div className="flex flex-col gap-1.5 min-w-[160px] flex-1 sm:flex-initial">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project</label>
                      <div className="relative">
                        <select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="w-full h-[46px] pl-4 pr-10 border border-borderColor rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-textColor font-bold appearance-none cursor-pointer shadow-sm transition-all duration-200"
                        >
                          {projectOptions.map((proj) => (
                            <option key={proj} value={proj}>
                              {proj}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                          <MdExpandMore className="text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Duration Select */}
                    <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 sm:flex-initial">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Duration</label>
                      <div className="relative">
                        <select
                          value={selectedDuration}
                          onChange={(e) => setSelectedDuration(e.target.value)}
                          className="w-full h-[46px] pl-4 pr-10 border border-borderColor rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-textColor font-bold appearance-none cursor-pointer shadow-sm transition-all duration-200"
                        >
                          {durationOptions.map((dur) => (
                            <option key={dur} value={dur}>
                              {dur}
                            </option>
                          ))}
                          {selectedDuration.includes('→') && (
                            <option value={selectedDuration}>{selectedDuration}</option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                          <MdExpandMore className="text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={handleApply}
                      className="px-6 h-[46px] bg-[#5cb85c] hover:bg-[#4cae4c] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm cursor-pointer flex items-center justify-center min-w-[88px] flex-1 sm:flex-initial"
                    >
                      Apply
                    </button>

                    {/* Export Report Dropdown Button */}
                    <div className="relative flex-1 sm:flex-initial">
                      <button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="w-full sm:w-auto px-6 h-[46px] bg-primary hover:bg-[#4cae4c] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span>Export Report</span>
                      </button>

                      {showExportDropdown && (
                        <div className="absolute right-0 mt-2 w-52 bg-white border border-borderColor rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                          <button
                            onClick={() => {
                              setShowExportDropdown(false);
                              handlePDFExport();
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-textColor hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors duration-150"
                          >
                            <span className="text-sm">📄</span> Download PDF Report
                          </button>
                          <button
                            onClick={() => {
                              setShowExportDropdown(false);
                              handleExcelExport();
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-textColor hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors duration-150"
                          >
                            <span className="text-sm">📊</span> Download Excel Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tab Navigation Section */}
                <div className="border-b border-borderColor bg-white w-full">
                  <div className="flex items-center gap-8 overflow-x-auto scrollbar-none whitespace-nowrap w-full">
                    {tabs.map((tab) => {
                      const TabIcon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative flex items-center gap-2 py-4 text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none select-none group
                            ${isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'}
                          `}
                        >
                          <TabIcon className="text-lg transition-colors duration-200 text-current" />
                          <span>{tab.label}</span>

                          {isActive && (
                            <motion.div
                              layoutId="activeTabUnderline"
                              className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Tab Content Render Area with smooth fade-in animation */}
                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="w-full"
                    >
                      {renderTabContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg z-[9999] flex items-center gap-2 text-sm font-semibold transition-all duration-300">
          <span>✓</span> {successToast}
        </div>
      )}
    </div>
  );
};

export default UserInsightsPage;
