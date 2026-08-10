import React from 'react';
import { MdAssignment, MdCheckCircle, MdAutorenew, MdFactCheck } from 'react-icons/md';

const TimelineTab = ({ projects }) => {
  // Mock logic to show an overall timeline for the SPV based on their projects
  // In reality, this would plot specific project milestones. We'll show an aggregate view.

  let earliestAssigned = null;
  let latestCompleted = null;
  
  projects.forEach(p => {
    if (p.assignedDate) {
      const d = new Date(p.assignedDate);
      if (!earliestAssigned || d < earliestAssigned) earliestAssigned = d;
      if (p.status === 'SPV-RATED' || p.status === 'HO-RATED') {
        if (!latestCompleted || d > latestCompleted) latestCompleted = new Date(); // Mocking completed date as now for demo if not strictly stored
      }
    }
  });

  const formatDate = (date) => {
    if (!date) return 'Pending';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const steps = [
    {
      id: 1,
      label: 'Assigned',
      date: formatDate(earliestAssigned),
      icon: MdAssignment,
      color: 'blue',
      active: true
    },
    {
      id: 2,
      label: 'Approved',
      date: formatDate(earliestAssigned ? new Date(earliestAssigned.getTime() + 7*24*60*60*1000) : null), // Mock +7 days
      icon: MdFactCheck,
      color: 'amber',
      active: projects.some(p => p.status !== 'NOT-RATED' && p.status !== 'ON-GOING')
    },
    {
      id: 3,
      label: 'In Progress',
      date: formatDate(earliestAssigned ? new Date(earliestAssigned.getTime() + 14*24*60*60*1000) : null), // Mock +14 days
      icon: MdAutorenew,
      color: 'green',
      active: projects.some(p => p.status === 'HO-PROCESS' || p.status === 'HO-RATED' || p.status === 'SPV-RATED')
    },
    {
      id: 4,
      label: 'Completed',
      date: formatDate(latestCompleted),
      icon: MdCheckCircle,
      color: 'emerald',
      active: projects.some(p => p.status === 'SPV-RATED' || p.status === 'HO-RATED')
    }
  ];

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col p-8">
      <h2 className="text-lg font-bold text-gray-800 mb-12">Project Timeline (Overall)</h2>
      
      <div className="relative flex justify-between items-center mb-16 px-10">
        
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-1000" 
            style={{ width: steps[3].active ? '100%' : steps[2].active ? '66%' : steps[1].active ? '33%' : '0%' }}
          ></div>
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-colors duration-500 ${
                step.active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="text-2xl" />
              </div>
              <div className="absolute top-16 text-center w-32">
                <p className={`text-sm font-bold mt-2 ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                <p className="text-xs text-gray-500 mt-1">{step.date}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-between mt-10 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <MdAutorenew className="text-xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Average Project Completion Time</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Time Taken for Completed Projects</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-gray-900">41 Days</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">328 Days Total</p>
        </div>
      </div>

    </div>
  );
};

export default TimelineTab;
