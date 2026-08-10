import React from 'react';
import { MdFilterList } from 'react-icons/md';
import CustomDropdown from '../../../components/common/CustomDropdown';

const MasterListFilters = ({ filters, setFilters }) => {
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const projectOptions = [{ label: 'All Projects', value: '' }];
  const categoryOptions = [{ label: 'All Categories', value: '' }];
  const assetTypeOptions = [{ label: 'All Assets', value: '' }];
  
  const roadTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Main Carriageway', value: 'Main Carriageway' },
    { label: 'Service Road', value: 'Service Road' },
    { label: 'Slip Road', value: 'Slip Road' }
  ];
  
  const directionOptions = [
    { label: 'All Directions', value: '' },
    { label: 'Increasing', value: 'Increasing' },
    { label: 'Decreasing', value: 'Decreasing' }
  ];
  
  const placementOptions = [
    { label: 'All Placements', value: '' },
    { label: 'LHS', value: 'LHS' },
    { label: 'RHS', value: 'RHS' },
    { label: 'Median', value: 'Median' }
  ];
  
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b border-gray-100 pb-3">
        <MdFilterList className="text-xl text-green-600" />
        <h4>Master List Filters</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        
        {/* Project Filter */}
        <div className="flex flex-col z-[70]">
          <label className="text-xs font-medium text-gray-500 mb-1">Project</label>
          <CustomDropdown 
            options={projectOptions}
            value={filters.project || ''}
            onChange={(val) => handleFilterChange('project', val)}
            placeholder="All Projects"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-col z-[60]">
          <label className="text-xs font-medium text-gray-500 mb-1">Category</label>
          <CustomDropdown 
            options={categoryOptions}
            value={filters.category || ''}
            onChange={(val) => handleFilterChange('category', val)}
            placeholder="All Categories"
          />
        </div>

        {/* Asset Type Filter */}
        <div className="flex flex-col z-[50]">
          <label className="text-xs font-medium text-gray-500 mb-1">Asset Type</label>
          <CustomDropdown 
            options={assetTypeOptions}
            value={filters.assetType || ''}
            onChange={(val) => handleFilterChange('assetType', val)}
            placeholder="All Assets"
          />
        </div>

        {/* Road Type Filter */}
        <div className="flex flex-col z-[40]">
          <label className="text-xs font-medium text-gray-500 mb-1">Road Type</label>
          <CustomDropdown 
            options={roadTypeOptions}
            value={filters.roadType || ''}
            onChange={(val) => handleFilterChange('roadType', val)}
            placeholder="All Types"
          />
        </div>

        {/* Direction Filter */}
        <div className="flex flex-col z-[30]">
          <label className="text-xs font-medium text-gray-500 mb-1">Direction</label>
          <CustomDropdown 
            options={directionOptions}
            value={filters.direction || ''}
            onChange={(val) => handleFilterChange('direction', val)}
            placeholder="All Directions"
          />
        </div>

        {/* Placement Filter */}
        <div className="flex flex-col z-[20]">
          <label className="text-xs font-medium text-gray-500 mb-1">Placement</label>
          <CustomDropdown 
            options={placementOptions}
            value={filters.placement || ''}
            onChange={(val) => handleFilterChange('placement', val)}
            placeholder="All Placements"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col z-[10]">
          <label className="text-xs font-medium text-gray-500 mb-1">Status</label>
          <CustomDropdown 
            options={statusOptions}
            value={filters.status || ''}
            onChange={(val) => handleFilterChange('status', val)}
            placeholder="All Statuses"
          />
        </div>

      </div>
    </div>
  );
};

export default MasterListFilters;
