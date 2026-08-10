import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div 
        className="w-full max-w-7xl mx-auto flex flex-col gap-6"
        initial={{ opacity: 0, y: -40, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ 
          duration: 0.6, 
          ease: [0.16, 1, 0.3, 1], // Custom smooth ease-out curve
          staggerChildren: 0.1 
        }}
      >
        
        {/* Header section */}
        <motion.div 
          className="flex items-center gap-3 mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <MdOutlinePrecisionManufacturing className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inspection Engine</h1>
            <p className="text-sm text-gray-500">Generate inspection batches by sampling the Master List Question Bank.</p>
          </div>
        </motion.div>

        {/* Batch Generator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BatchCreationForm onBatchCreated={handleBatchCreated} />
        </motion.div>

        {/* Generated Batches List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-gray-800">Generated Batches</h2>
          <BatchListTable 
            batches={batches} 
            loading={loading} 
            onDelete={handleDeleteBatch}
            onView={(batch) => setSelectedBatchId(batch._id)}
          />
        </motion.div>

        {/* Summary Modal */}
        {selectedBatchId && (
          <BatchSummaryModal 
            batchId={selectedBatchId} 
            onClose={() => setSelectedBatchId(null)} 
          />
        )}
        
      </motion.div>
    </Layout>
  );
};

export default InspectionEnginePage;
