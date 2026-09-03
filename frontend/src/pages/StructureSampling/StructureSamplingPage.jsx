import React, { useState, useEffect } from 'react';
import Premium3DButton from '../../components/common/Premium3DButton';
import { useNavigate } from 'react-router-dom';
import { masterListService } from '../../services/masterList.service';
import { structureEngineService } from '../../services/structureEngine.service';
import Layout from '../../components/Layout';
import { MdAddRoad, MdOutlinePrecisionManufacturing } from 'react-icons/md';
import CustomDropdown from '../../components/common/CustomDropdown';

export default function StructureSamplingPage() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  const [file, setFile] = useState(null);
  const [intervalMetres, setIntervalMetres] = useState(20);
  const [minChainage, setMinChainage] = useState('');
  const [maxChainage, setMaxChainage] = useState('');
  const [structureTypeFilter, setStructureTypeFilter] = useState('All Structures');
  const [batchName, setBatchName] = useState('');

  const [detectedSheets, setDetectedSheets] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await masterListService.getProjects();
      if (res.success) setProjects(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDetectedSheets(null);
      setSelectedSheets([]);
      setPreview(null);
      setError(null);
    }
  };

  const handleDetectSheets = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload an Excel file.');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await structureEngineService.detectSheets(file);
      if (res.success) {
        setDetectedSheets(res.data);
        setSelectedSheets(res.data); // select all by default
      } else {
        setError(res.message || 'Failed to detect sheets in excel.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to detect sheets');
    } finally {
      setLoading(false);
    }
  };

  const toggleSheetSelection = (sheet) => {
    const isSelected = selectedSheets.some(s => s.sheetName === sheet.sheetName);
    if (isSelected) {
      setSelectedSheets(prev => prev.filter(s => s.sheetName !== sheet.sheetName));
    } else {
      setSelectedSheets(prev => [...prev, sheet]);
    }
    setPreview(null);
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (selectedSheets.length === 0) {
      setError('Please select at least one sheet to parse.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await structureEngineService.parseExcel(
        file, 
        intervalMetres, 
        selectedSheets, 
        minChainage ? parseFloat(minChainage) : null,
        maxChainage ? parseFloat(maxChainage) : null,
        structureTypeFilter
      );
      if (res.success) {
        setPreview(res.data);
      } else {
        setError(res.message || 'Failed to parse structure excel.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!selectedProject) {
      setError('Please select a project before generating the batch.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const data = {
        projectId: selectedProject,
        structures: preview.validStructures,
        batchName: batchName
      };

      const res = await structureEngineService.generateBatch(data);
      if (res.success) {
        navigate('/inspection-engine'); // Navigate to main inspection engine where batches are listed
      } else {
        setError(res.message || 'Failed to create structure batch.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <MdAddRoad className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Structures Sampling</h1>
            <p className="text-sm text-gray-500">Upload Structure Excel to generate independent inspection batches</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex flex-col gap-1 shadow-sm">
            <div className="font-semibold text-sm">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Configuration</h2>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <CustomDropdown
                  options={projects}
                  value={selectedProject}
                  onChange={(val) => {
                    setSelectedProject(val);
                    setPreview(null);
                  }}
                  placeholder="Select Project"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Structure Excel</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700
                      hover:file:bg-green-100
                    "
                  />
                </div>
                {file && <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Interval (m)</label>
                <input
                  type="number"
                  value={intervalMetres}
                  onChange={(e) => {
                    setIntervalMetres(e.target.value);
                    setPreview(null);
                  }}
                  placeholder="e.g. 20"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
            </div>

            {/* Optional Filtering Section */}
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Structure Type Filter (Optional)</label>
                <CustomDropdown
                  options={['All Structures', 'Major Bridge', 'Minor Bridge', 'Box Culvert', 'Pipe Culvert', 'PUP', 'VUP', 'LVUP']}
                  value={structureTypeFilter}
                  onChange={(val) => {
                    setStructureTypeFilter(val);
                    setPreview(null);
                  }}
                  placeholder="Select Type"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Chainage (Optional)</label>
                <input
                  type="number"
                  step="0.001"
                  value={minChainage}
                  onChange={(e) => {
                    setMinChainage(e.target.value);
                    setPreview(null);
                  }}
                  placeholder="e.g. 280.000"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Chainage (Optional)</label>
                <input
                  type="number"
                  step="0.001"
                  value={maxChainage}
                  onChange={(e) => {
                    setMaxChainage(e.target.value);
                    setPreview(null);
                  }}
                  placeholder="e.g. 300.000"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
            </div>

            {!detectedSheets && (
              <div className="mt-4 flex justify-end">
                <Premium3DButton
                  onClick={handleDetectSheets}
                  disabled={loading || !file}
                  className="!w-auto flex items-center justify-center gap-2"
                >
                  {loading ? 'Detecting Sheets...' : 'Detect Sheets'}
                </Premium3DButton>
              </div>
            )}
          </div>
        </div>

        {detectedSheets && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Detected Structure Sheets</h2>
            <p className="text-sm text-gray-500 mb-4">Select the sheets you want to parse for structure extraction.</p>
            
            {detectedSheets.length === 0 ? (
              <p className="text-sm text-red-500">No structure sheets were detected. Please check the excel format.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {detectedSheets.map((sheet, idx) => {
                  const isSelected = selectedSheets.some(s => s.sheetName === sheet.sheetName);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleSheetSelection(sheet)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${isSelected ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{sheet.sheetName}</div>
                        <div className="text-xs text-gray-500">Detected as: {sheet.type}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Premium3DButton
                onClick={handlePreview}
                disabled={loading || selectedSheets.length === 0}
                className="!w-auto flex items-center justify-center gap-2"
              >
                {loading && !preview ? 'Parsing Sheets...' : 'Parse & Preview'}
              </Premium3DButton>
            </div>
          </div>
        )}

        {preview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4 text-green-700 font-bold">
              <MdOutlinePrecisionManufacturing size={20} />
              <h3>Validation Preview</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Structures Found</div>
                <div className="text-2xl font-bold text-green-700">{preview.validStructuresCount}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Inspection Points</div>
                <div className="text-2xl font-bold text-green-700">{preview.totalInspectionPoints}</div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Total Questions</div>
                <div className="text-2xl font-bold text-green-700">{preview.totalQuestionsGenerated !== undefined ? preview.totalQuestionsGenerated : '?'}</div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="text-xs text-orange-700 font-medium uppercase tracking-wider mb-1">Invalid/Skipped</div>
                <div className="text-2xl font-bold text-orange-700">{preview.invalidStructuresCount}</div>
              </div>
            </div>

            {/* Validation Table for Valid Structures */}
            <div className="mb-6 overflow-x-auto">
              <h4 className="text-md font-bold text-gray-800 mb-2">Parsed Structures</h4>
              <table className="w-full text-sm text-left text-gray-500 border">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Structure ID</th>
                    <th className="px-4 py-3">Start CH</th>
                    <th className="px-4 py-3">End CH</th>
                    <th className="px-4 py-3">Length</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3">Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.validStructures.map((s, idx) => (
                    <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{s.structureId}</td>
                      <td className="px-4 py-2">{s.startChainage?.toFixed(3)}</td>
                      <td className="px-4 py-2">{s.endChainage ? s.endChainage.toFixed(3) : '-'}</td>
                      <td className="px-4 py-2">{s.length ? `${s.length}m` : '-'}</td>
                      <td className="px-4 py-2">{s.side}</td>
                      <td className="px-4 py-2">{s.type || '-'}</td>
                      <td className="px-4 py-2 font-semibold">{s.generatedChainages?.length}</td>
                      <td className="px-4 py-2 text-green-600 font-semibold">{s.questionsMatrix?.totalGenerated}</td>
                    </tr>
                  ))}
                  {preview.validStructures.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-4 text-center">No valid structures found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Question Validation Table */}
            {preview.validStructures.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h4 className="text-md font-bold text-gray-800 mb-2">Question Validation</h4>
                <table className="w-full text-sm text-left text-gray-500 border">
                  <thead className="text-xs text-gray-700 uppercase bg-green-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Structure Type</th>
                      <th className="px-4 py-3">Normalized Type</th>
                      <th className="px-4 py-3 text-center">Applicable Questions</th>
                      <th className="px-4 py-3 text-center">Inspection Points</th>
                      <th className="px-4 py-3 text-center">Total Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const aggregatedByType = {};
                      preview.validStructures.forEach(s => {
                        if (!aggregatedByType[s.type]) {
                          aggregatedByType[s.type] = {
                            type: s.type,
                            normalizedType: s.normalizedType,
                            applicable: s.questionsMatrix?.applicable || 0,
                            points: 0,
                            totalQuestions: 0
                          };
                        }
                        aggregatedByType[s.type].points += (s.generatedChainages?.length || 0);
                        aggregatedByType[s.type].totalQuestions += (s.questionsMatrix?.totalGenerated || 0);
                      });
                      
                      return Object.values(aggregatedByType).map((s, idx) => (
                        <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{s.type}</td>
                          <td className="px-4 py-2">{s.normalizedType || 'Unknown'}</td>
                          <td className="px-4 py-2 text-center">{s.applicable}</td>
                          <td className="px-4 py-2 text-center font-semibold text-green-600">{s.points}</td>
                          <td className="px-4 py-2 text-center font-semibold text-green-600">{s.totalQuestions}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Invalid Records */}
            {preview.invalidStructures.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h4 className="text-md font-bold text-red-600 mb-2">Invalid Records</h4>
                <table className="w-full text-sm text-left text-red-500 border">
                  <thead className="text-xs text-red-700 uppercase bg-red-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Sheet</th>
                      <th className="px-4 py-3">Excel Row</th>
                      <th className="px-4 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.invalidStructures.map((inv, idx) => (
                      <tr key={idx} className="bg-white border-b hover:bg-red-50">
                        <td className="px-4 py-2">{inv.sheet}</td>
                        <td className="px-4 py-2 font-medium text-red-900">Row {inv.rowNumber}</td>
                        <td className="px-4 py-2">{inv.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-8 border-t pt-6">
              <h4 className="text-md font-bold text-gray-800 mb-4">Batch Generation</h4>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name (Optional)</label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Structure Inspection 2026"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-600">
                  This will create <strong>{preview.totalInspectionPoints}</strong> independent Structure inspection tasks.
                </div>
                
                <Premium3DButton
                  onClick={handleGenerateBatch}
                  disabled={loading || preview.validStructuresCount === 0 || !selectedProject}
                  className="!w-auto flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Batch...' : 'Generate Structure Batch'}
                </Premium3DButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
