import React from 'react';
import { MdHistory, MdAssignment, MdCheckCircle, MdOutlineRateReview } from 'react-icons/md';

const ActivityLogTab = ({ projects }) => {
  // Generate some mock activity based on projects
  const activities = [];
  
  projects.forEach(p => {
    if (p.assignedDate) {
      activities.push({
        id: `${p._id}-assigned`,
        title: 'Project Assigned',
        desc: `Project ${p.name} (${p.roadName}) was assigned to this SPV.`,
        date: p.assignedDate,
        icon: MdAssignment,
        color: 'blue'
      });
    }
    
    if (p.status === 'SPV-RATED' || p.status === 'HO-RATED') {
      activities.push({
        id: `${p._id}-completed`,
        title: 'Project Ratings Completed',
        desc: `All inspections and ratings for ${p.name} have been completed.`,
        date: new Date().toISOString(), // Mock completion date
        icon: MdCheckCircle,
        color: 'green'
      });
    } else if (p.status === 'HO-PROCESS') {
      activities.push({
        id: `${p._id}-review`,
        title: 'Project In Review',
        desc: `Ratings for ${p.name} are currently under HO Review.`,
        date: new Date(Date.now() - 86400000).toISOString(), // Mock 1 day ago
        icon: MdOutlineRateReview,
        color: 'amber'
      });
    }
  });

  // Sort newest first
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col p-8">
      <div className="flex items-center gap-3 mb-8">
        <MdHistory className="text-2xl text-gray-400" />
        <h2 className="text-lg font-bold text-gray-800">Recent Activity Log</h2>
      </div>

      <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm ml-6">No recent activity.</p>
        ) : (
          activities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className={`absolute -left-[17px] top-0.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm bg-${item.color}-50 text-${item.color}-600`}>
                  <Icon className="text-sm" />
                </div>
                
                {/* Content */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                    <span className="text-xs font-bold text-gray-400">{formatTime(item.date)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityLogTab;
