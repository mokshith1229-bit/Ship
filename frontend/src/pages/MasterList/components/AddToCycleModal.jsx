import React, { useState, useEffect } from 'react';
import { MdClose, MdRefresh, MdCheckCircle } from 'react-icons/md';
import { masterListService } from '../../../services/masterList.service';
import api from '../../../services/api';

const AddToCycleModal = ({ project, newMasterListIds, onClose, onSuccess }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Select Cycle, 2: Preview, 3: Success

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/inspection-engine/batches', {
          params: { project }
        });
        if (res.data && res.data.data) {
          setBatches(res.data.data || []);
        } else {
          setBatches(res.data || []);
        }
      } catch (err) {
        setError('Failed to load inspection cycles.');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [project]);

  const handlePreview = async () => {
    if (!selectedBatchId) {
      setError('Please select an inspection cycle');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await masterListService.previewAddToCycle(newMasterListIds, selectedBatchId, project);
      setPreviewData(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterListService.executeAddToCycle(newMasterListIds, selectedBatchId, project);
      setPreviewData(res.data); // Keep final summary
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update inspection cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (step < 3) {
      if (window.confirm("Do you want to cancel and remove these items from the Master List?")) {
        try {
          await masterListService.cancelImport(newMasterListIds);
        } catch (e) {
          console.error("Failed to rollback import", e);
        }
        if (onSuccess) onSuccess(); // Refresh master list behind
      }
    }
    onClose();
  };

  const handleFinish = () => {
    if (step === 3) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add to Existing Inspection Cycle</h3>
            <p className="text-sm text-gray-500">Append newly imported Master List items to an existing cycle</p>
          </div>
          <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <MdClose size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Inspection Cycle / Version</label>
                {loading && batches.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading cycles...</p>
                ) : (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="" disabled>Select a cycle for project {project}</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name} - {b.status} (Created: {new Date(b.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg text-blue-800">
                <strong>Note:</strong> We will only add new parameters that are missing from this cycle. Existing tasks and ratings will not be modified or overwritten.
              </p>
            </div>
          )}

          {step === 2 && previewData && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">New ML Params</p>
                  <p className="text-2xl font-bold text-gray-800">{previewData.summary.newMasterListParameters}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Update Existing Tasks</p>
                  <p className="text-2xl font-bold text-blue-700">{previewData.summary.existingTasksToUpdate}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Create New Tasks</p>
                  <p className="text-2xl font-bold text-green-700">{previewData.summary.newInspectionTasksToCreate}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Images to Extract</p>
                  <p className="text-2xl font-bold text-purple-700">{previewData.summary.imagesToExtract}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chainage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Existing Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.tableData.map((row, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.masterListId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.assetType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.chainage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.existingTask === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {row.existingTask}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {row.action === 'CREATE TASK' ? (
                            <span className="text-green-600">{row.action}</span>
                          ) : (
                            <span className="text-blue-600">{row.action}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.tableData.length === 0 && (
                  <div className="p-6 text-center text-gray-500">No actions to perform.</div>
                )}
              </div>
            </div>
          )}

          {step === 3 && previewData && (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
                <MdCheckCircle size={40} />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Extraction Task Created!</h4>
              <p className="text-gray-500 mb-8">The parameters have been queued for processing. Please go to the Inspection Engine to process the task.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 col-span-4 text-center">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Parameters Queued</p>
                  <p className="text-xl font-bold text-blue-800">{previewData.summary.newUnratedParameters}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {step < 3 && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          
          {step === 1 && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading || !selectedBatchId}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? 'Processing...' : 'Preview Changes'}
            </button>
          )}
          
          {step === 2 && (
            <button
              type="button"
              onClick={handleExecute}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading && <MdRefresh className="animate-spin" size={18} />}
              {loading ? 'Updating Cycle...' : 'Confirm & Add to Cycle'}
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AddToCycleModal;
