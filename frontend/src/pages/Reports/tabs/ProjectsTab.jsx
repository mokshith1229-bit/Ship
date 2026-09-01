import React from 'react';

const ProjectsTab = ({ projects }) => {
  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">Assigned Projects</h2>
        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg">{projects.length} Total</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-4 px-6">Project Name</th>
              <th className="py-4 px-6">Road Name</th>
              <th className="py-4 px-6">Assigned Date</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-gray-400 text-sm">No projects assigned to this SPV</td>
              </tr>
            ) : (
              projects.map(p => (
                <tr key={p._id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="py-4 px-6 font-bold text-gray-800 text-sm">{p.name}</td>
                  <td className="py-4 px-6 text-gray-600 text-sm">{p.roadName}</td>
                  <td className="py-4 px-6 text-gray-500 text-sm">
                    {p.assignedDate ? new Date(p.assignedDate).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      p.status === 'SPV-RATED' || p.status === 'HO-RATED' ? 'bg-green-100 text-green-700' :
                      p.status === 'HO-PROCESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status === 'SPV-RATED' || p.status === 'HO-RATED' ? 'Completed' : (p.status === 'HO-PROCESS' ? 'In Review' : 'In Progress')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className={`h-full rounded-full ${p.progress === 100 ? 'bg-green-500' : 'bg-green-400'}`}
                          style={{ width: `${p.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-8">{p.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsTab;
