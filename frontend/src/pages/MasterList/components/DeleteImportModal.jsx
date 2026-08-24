import React, { useState, useEffect } from 'react';
import { MdClose, MdWarning, MdDelete } from 'react-icons/md';
import { masterListService } from '../../../services/masterList.service';

const DeleteImportModal = ({ batchId, onClose, onSuccess }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const res = await masterListService.previewDeleteImport(batchId);
        if (res.success) {
          setPreview(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to check import dependencies');
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [batchId]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await masterListService.deleteImport(batchId);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete import');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">Delete Import Batch</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <MdClose size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Checking for dependencies...</div>
          ) : preview ? (
            <div className="flex flex-col gap-6">
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">File:</span>
                  <span className="font-semibold text-gray-900">{preview.batch.originalFileName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">Project:</span>
                  <span className="font-semibold text-gray-900">{preview.batch.project}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Master List Records:</span>
                  <span className="font-bold text-red-600">{preview.recordsCount}</span>
                </div>
              </div>

              {(preview.referencedTasks > 0 || preview.referencedRatings > 0) && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-3 text-orange-800">
                  <MdWarning className="text-orange-500 text-2xl flex-shrink-0" />
                  <div>
                    <p className="font-bold mb-1">This import is currently being used!</p>
                    <p className="text-sm mb-3">Deleting this import will permanently remove the questions from the Master List and any active Inspection Tasks. Existing ratings will remain untouched, but the tasks may be orphaned.</p>
                    
                    <ul className="text-sm space-y-1 font-medium bg-white/50 p-3 rounded-lg border border-orange-100">
                      <li className="flex justify-between">
                        <span>Referenced Tasks:</span>
                        <span>{preview.referencedTasks}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Referenced Ratings:</span>
                        <span>{preview.referencedRatings}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Referenced Images:</span>
                        <span>{preview.referencedImages}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 text-center">
                Are you sure you want to permanently delete these {preview.recordsCount} records?
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting || !preview}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {deleting ? 'Deleting...' : (
              <>
                <MdDelete size={18} />
                Delete Import
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteImportModal;
