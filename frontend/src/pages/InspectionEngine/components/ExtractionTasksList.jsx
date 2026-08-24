import React, { useState } from 'react';
import { MdPlayArrow, MdRefresh, MdCheckCircle, MdError, MdPendingActions } from 'react-icons/md';
import { inspectionEngineService } from '../../../services/inspectionEngine.service';

const ExtractionTasksList = ({ tasks, onRefresh }) => {
  const [processingId, setProcessingId] = useState(null);

  const handleProcess = async (taskId) => {
    setProcessingId(taskId);
    try {
      await inspectionEngineService.processExtractionTask(taskId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to process task');
      onRefresh();
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status, errorMessage) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"><MdPendingActions /> Pending</span>;
      case 'Processing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"><MdRefresh className="animate-spin" /> Processing</span>;
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full"><MdCheckCircle /> Completed</span>;
      case 'Failed':
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full"><MdError /> Failed</span>
            {errorMessage && <span className="text-xs text-red-600 max-w-xs truncate" title={errorMessage}>{errorMessage}</span>}
          </div>
        );
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  if (!tasks || tasks.length === 0) {
    return null; // Don't show anything if there are no tasks
  }

  return (
    <div className="mt-8 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Master List Extraction Tasks</h3>
          <p className="text-sm text-gray-500">Tasks waiting to extract images and add parameters to existing cycles</p>
        </div>
        <button onClick={onRefresh} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <MdRefresh size={20} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Cycle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameters</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map(task => (
              <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.project}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.inspectionId?.name || 'Unknown'} 
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.originalMasterListIds?.length || 0} Questions
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(task.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(task.status, task.errorMessage)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {task.status === 'Pending' || task.status === 'Failed' ? (
                    <button
                      onClick={() => handleProcess(task._id)}
                      disabled={processingId === task._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {processingId === task._id ? <MdRefresh className="animate-spin" /> : (task.status === 'Failed' ? <MdRefresh /> : <MdPlayArrow />)}
                      {processingId === task._id ? 'Processing...' : (task.status === 'Failed' ? 'Retry' : 'Process')}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExtractionTasksList;
