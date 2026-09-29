import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DownloadAppPage = () => {
  const handleDownload = () => {
    // Basic download placeholder or link if available
    alert("Downloading App version 2.0.7...");
    // window.location.href = '/path/to/apk'; 
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F1F5F9] p-6 relative">
          
          <div className="max-w-7xl mx-auto mt-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Download App</h1>
            
            <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">APP VERSION</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">APP RELEASE DATE</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">APP SIZE</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">CHANGE LOG</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">DOWNLOAD APP</th>
                  </tr>
                </thead>
                <tbody className="bg-[#f0f6fc]">
                  <tr>
                    <td className="px-6 py-6 text-sm text-gray-700 font-medium">2.0.7</td>
                    <td className="px-6 py-6 text-sm text-gray-700">24-Aug-23, 12:00:00 AM</td>
                    <td className="px-6 py-6 text-sm text-gray-700">8.8 MB</td>
                    <td className="px-6 py-6 text-sm text-gray-700">New Release</td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={handleDownload}
                        className="bg-[#0a4d29] hover:bg-[#07381d] text-white text-sm font-bold px-4 py-2 rounded shadow-sm transition-colors"
                      >
                        Click To Download APP
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default DownloadAppPage;
