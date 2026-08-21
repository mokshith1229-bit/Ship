import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterListService } from '../../services/masterList.service';
import { atmsService } from '../../services/atms.service';
import Layout from '../../components/Layout';
import { MdCameraOutdoor, MdFactCheck } from 'react-icons/md';

export default function AtmsPage() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  const [file, setFile] = useState(null);
  const [batchName, setBatchName] = useState('');

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
      setPreview(null);
      setError(null);
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload an Excel file.');
      return;
    }
    if (!selectedProject) {
      setError('Please select a project before parsing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await atmsService.parseExcel(file, selectedProject);
      if (res.success) {
        setPreview(res.data);
      } else {
        setError(res.message || 'Failed to parse ATMS excel.');
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
      const res = await atmsService.generateBatch(selectedProject, preview.validAssets, batchName);
      if (res.success) {
        navigate('/inspection-engine'); // Navigate to main inspection engine where batches are listed
      } else {
        setError(res.message || 'Failed to create ATMS batch.');
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
          <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <MdCameraOutdoor size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ATMS Management</h1>
            <p className="text-sm text-gray-500">Inspect and rate ATMS assets like CCTV, VMS, Traffic Signals, etc.</p>
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
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload ATMS Excel</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                    "
                  />
                </div>
                {file && <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handlePreview}
                disabled={loading || !file || !selectedProject}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading && !preview ? 'Parsing Sheets...' : 'Parse & Preview'}
              </button>
            </div>
          </div>
        </div>

        {preview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold">
              <MdFactCheck size={20} />
              <h3>Validation Preview</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="text-xs text-indigo-700 font-medium uppercase tracking-wider mb-1">ATMS Found</div>
                <div className="text-2xl font-bold text-indigo-700">{preview.summary.assetsFound}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Inspection Points</div>
                <div className="text-2xl font-bold text-green-700">{preview.summary.assetsFound}</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-700 font-medium uppercase tracking-wider mb-1">Total Questions</div>
                <div className="text-2xl font-bold text-blue-700">{preview.summary.totalQuestionsGenerated}</div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="text-xs text-orange-700 font-medium uppercase tracking-wider mb-1">Invalid/Skipped</div>
                <div className="text-2xl font-bold text-orange-700">{preview.summary.invalidSkipped}</div>
              </div>
            </div>

            {/* Validation Table for Valid Assets */}
            <div className="mb-6 overflow-x-auto">
              <h4 className="text-md font-bold text-gray-800 mb-2">Parsed ATMS Assets</h4>
              <table className="w-full text-sm text-left text-gray-500 border">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">ATMS Type</th>
                    <th className="px-4 py-3">Chainage</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.validAssets.map((f, idx) => (
                    <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{idx + 1}</td>
                      <td className="px-4 py-2">{f.originalType}</td>
                      <td className="px-4 py-2">{f.chainage?.toFixed(3)}</td>
                      <td className="px-4 py-2">{f.side}</td>
                      <td className="px-4 py-2">{f.location || '-'}</td>
                      <td className="px-4 py-2 text-indigo-600 font-semibold">{f.questionsMatrix?.totalGenerated}</td>
                      <td className="px-4 py-2 text-green-600 font-semibold">Valid</td>
                    </tr>
                  ))}
                  {preview.validAssets.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center">No valid ATMS assets found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Invalid Records */}
            {preview.invalidAssets.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h4 className="text-md font-bold text-red-600 mb-2">Invalid Records</h4>
                <table className="w-full text-sm text-left text-red-500 border">
                  <thead className="text-xs text-red-700 uppercase bg-red-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Chainage</th>
                      <th className="px-4 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.invalidAssets.map((inv, idx) => (
                      <tr key={idx} className="bg-white border-b hover:bg-red-50">
                        <td className="px-4 py-2">{inv.row}</td>
                        <td className="px-4 py-2">{inv.assetRaw || '-'}</td>
                        <td className="px-4 py-2">{inv.chainageRaw || '-'}</td>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name (Optional)</label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. ATMS 2026"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-600">
                  This will create <strong>{preview.summary.assetsFound}</strong> independent ATMS inspection tasks.
                </div>
                
                <button
                  onClick={handleGenerateBatch}
                  disabled={loading || preview.summary.assetsFound === 0 || !selectedProject}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating Batch...' : 'Generate Inspection'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
