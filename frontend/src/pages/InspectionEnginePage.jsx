import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { MdOutlinePrecisionManufacturing } from 'react-icons/md';
import { inspectionEngineService } from '../services/inspectionEngine.service';
import BatchCreationForm from './InspectionEngine/components/BatchCreationForm';
import BatchListTable from './InspectionEngine/components/BatchListTable';
import BatchSummaryModal from './InspectionEngine/components/BatchSummaryModal';

const InspectionEnginePage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await inspectionEngineService.listBatches();
      setBatches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleBatchCreated = async (batchData) => {
    const res = await inspectionEngineService.createBatch(batchData);
    if (res.success) {
      await fetchBatches();
      setSelectedBatchId(res.data._id); // Auto-open modal to show summary
    }
  };

  const handleDeleteBatch = async (id) => {
    try {
      await inspectionEngineService.deleteBatch(id);
      await fetchBatches();
    } catch (err) {
      alert(err.message || 'Failed to delete batch');
    }
  };

  return (
    <Layout title="Inspection Engine (Sampling)">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header section */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MdOutlinePrecisionManufacturing className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inspection Engine</h1>
            <p className="text-sm text-gray-500">Generate inspection batches by sampling the Master List Question Bank.</p>
          </div>
        </div>

        {/* Batch Generator */}
        <BatchCreationForm onBatchCreated={handleBatchCreated} />

        {/* Generated Batches List */}
        <h2 className="text-lg font-bold text-gray-800">Generated Batches</h2>
        <BatchListTable 
          batches={batches} 
          loading={loading} 
          onDelete={handleDeleteBatch}
          onView={(batch) => setSelectedBatchId(batch._id)}
        />

        {/* Summary Modal */}
        {selectedBatchId && (
          <BatchSummaryModal 
            batchId={selectedBatchId} 
            onClose={() => setSelectedBatchId(null)} 
          />
        )}
        
      </div>
    </Layout>
  );
};

export default InspectionEnginePage;
