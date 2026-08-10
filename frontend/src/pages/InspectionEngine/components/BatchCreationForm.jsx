import React, { useState, useEffect } from 'react';
import { masterListService } from '../../../services/masterList.service';
import CustomDropdown from '../../../components/common/CustomDropdown';
import Premium3DButton from '../../../components/common/Premium3DButton';

const BatchCreationForm = ({ onBatchCreated }) => {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [samplingPercentage, setSamplingPercentage] = useState(10);
  const [customPercentage, setCustomPercentage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await masterListService.getProjects();
      if (res.success) setProjects(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await masterListService.getCategories();
      if (res.success) setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const finalPercentage = samplingPercentage === 'custom' 
      ? Number(customPercentage) 
      : Number(samplingPercentage);

    const payload = {
      project: selectedProject,
      samplingPercentage: finalPercentage
    };

    if (samplingPercentage === 'custom' && selectedCategory) {
      payload.category = selectedCategory;
    }

    try {
      await onBatchCreated(payload);
      // Reset form
      setSelectedProject('');
      setSelectedCategory('');
      setSamplingPercentage(10);
      setCustomPercentage('');
    } catch (err) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const projectOptions = projects.map(p => ({ label: p, value: p }));
  const categoryOptions = categories.map(c => ({ label: c, value: c }));
  const strategyOptions = [
    { label: '5%', value: 5 },
    { label: '10%', value: 10 },
    { label: '15%', value: 15 },
    { label: '20%', value: 20 },
    { label: 'Custom Filters', value: 'custom' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Generate Inspection Batch</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-end relative z-[60]">
          {/* Project Selection */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <CustomDropdown
              options={projectOptions}
              value={selectedProject}
              onChange={(val) => setSelectedProject(val)}
              placeholder="Select Project"
            />
          </div>

          {/* Sampling Percentage Selection */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Strategy (Random)</label>
            <CustomDropdown
              options={strategyOptions}
              value={samplingPercentage}
              onChange={(val) => {
                setSamplingPercentage(val);
                if (val !== 'custom') {
                  setSelectedCategory('');
                }
              }}
              placeholder="Select Strategy"
            />
          </div>

          <Premium3DButton 
            loading={loading}
            disabled={!selectedProject}
            type="submit"
          >
            {loading ? 'Generating...' : 'Generate Batch'}
          </Premium3DButton>
        </div>

        {/* Custom Strategy Filters Row */}
        {samplingPercentage === 'custom' && (
          <div className="flex flex-col md:flex-row gap-4 items-end p-4 bg-gray-50/50 border border-gray-100 rounded-lg mt-2 relative z-[50]">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
              <CustomDropdown
                options={categoryOptions}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                placeholder="All Categories"
              />
            </div>

            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom %</label>
              <input
                type="number"
                min="1"
                max="100"
                value={customPercentage}
                onChange={(e) => setCustomPercentage(e.target.value)}
                required
                className="w-full px-4 py-[7px] bg-white border border-[#5cb85c] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="e.g. 25"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BatchCreationForm;
