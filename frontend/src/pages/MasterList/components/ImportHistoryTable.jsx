import React, { useState, useEffect } from 'react';
import { MdVisibility, MdDelete, MdInfoOutline } from 'react-icons/md';
import { masterListService } from '../../../services/masterList.service';
import DeleteImportModal from './DeleteImportModal';

const ImportHistoryTable = ({ onViewImport }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [deleteModalId, setDeleteModalId] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await masterListService.getImportHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch import history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteSuccess = () => {
    setDeleteModalId(null);
    fetchHistory();
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading import history...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MdInfoOutline className="text-gray-400 text-lg" />
          Import History
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Imported Date</th>
              <th className="px-6 py-4">Records Added</th>
              <th className="px-6 py-4">Duplicates</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No import history found.
                </td>
              </tr>
            ) : (
              history.map((batch) => (
                <tr key={batch._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {batch.originalFileName || 'Unknown File'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {batch.project}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(batch.createdAt).toLocaleDateString()} {new Date(batch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-green-600 font-medium">
                    +{batch.imported}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {batch.duplicates}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${batch.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        batch.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewImport(batch._id, batch.project)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Records"
                      >
                        <MdVisibility size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteModalId(batch._id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Import"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteModalId && (
        <DeleteImportModal 
          batchId={deleteModalId} 
          onClose={() => setDeleteModalId(null)} 
          onSuccess={handleDeleteSuccess} 
        />
      )}
    </div>
  );
};

export default ImportHistoryTable;
