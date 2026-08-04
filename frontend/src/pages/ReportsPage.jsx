import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const ReportsPage = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pageBg">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-500">Reports</h1>
          <p className="text-gray-400">Reports module coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
