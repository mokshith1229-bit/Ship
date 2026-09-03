import React, { useState, useEffect } from 'react';
import Premium3DButton from '../../components/common/Premium3DButton';
import { useNavigate } from 'react-router-dom';
import { masterListService } from '../../services/masterList.service';
import { surveyLibraryService } from '../../services/surveyLibrary.service';
import { inspectionEngineService } from '../../services/inspectionEngine.service';
import Layout from '../../components/Layout';
import { MdAddRoad, MdOutlinePrecisionManufacturing } from 'react-icons/md';
import CustomDropdown from '../../components/common/CustomDropdown';

export default function RoadwaySamplingPage() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  const [surveys, setSurveys] = useState([]);
  const [selectedStreams, setSelectedStreams] = useState(['LHS', 'RHS', 'SR LHS', 'SR RHS']);

  const [startChainage, setStartChainage] = useState('');
  const [endChainage, setEndChainage] = useState('');
  const [intervalMetres, setIntervalMetres] = useState(20);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchSurveys(selectedProject);
    } else {
      setSurveys([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await masterListService.getProjects();
      if (res.success) setProjects(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSurveys = async (project) => {
    try {
      const res = await surveyLibraryService.getLibrary(project);
      if (res.success) setSurveys(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (surveys.length > 0) {
      let min = Infinity;
      let max = -Infinity;
      surveys.forEach(s => {
        if (s.coverage) {
          if (s.coverage.startChainage != null) min = Math.min(min, s.coverage.startChainage);
          if (s.coverage.endChainage != null) max = Math.max(max, s.coverage.endChainage);
        }
      });
      if (min !== Infinity) setStartChainage(min.toFixed(3));
      if (max !== -Infinity) setEndChainage(max.toFixed(3));
    } else {
      setStartChainage('');
      setEndChainage('');
    }
  }, [surveys]);

  const handleStreamToggle = (stream) => {
    setSelectedStreams(prev => 
      prev.includes(stream) ? prev.filter(s => s !== stream) : [...prev, stream]
    );
    setPreview(null);
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!selectedProject || selectedStreams.length === 0 || !startChainage || !endChainage || !intervalMetres) {
      setError('Please fill in all fields and select at least one stream to preview.');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const data = {
        project: selectedProject,
        streams: selectedStreams,
        startChainage: parseFloat(startChainage),
        endChainage: parseFloat(endChainage),
        intervalMetres: parseInt(intervalMetres, 10)
      };

      const res = await inspectionEngineService.previewRoadwayBatch(data);
      if (res.success) {
        setPreview(res.data);
      } else {
        setError(res.message || 'Failed to preview roadway batch.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    setLoading(true);
    setError(null);

    if (selectedStreams.length === 0) {
      setError('Please select at least one stream.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        project: selectedProject,
        streams: selectedStreams,
        startChainage: parseFloat(startChainage),
        endChainage: parseFloat(endChainage),
        intervalMetres: parseInt(intervalMetres, 10)
      };

      const res = await inspectionEngineService.createRoadwayBatch(data);
      if (res.success) {
        navigate('/inspection-engine'); // Navigate to main inspection engine where batches are listed
      } else {
        setError(res.message || 'Failed to create roadway batch.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <MdAddRoad className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Roadway Sampling</h1>
            <p className="text-sm text-gray-500">Continuous sampling based on existing Survey Library images</p>
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
          
          <form className="flex flex-col gap-5" onSubmit={handlePreview}>
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
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">Roadway Streams</label>
              <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {['LHS', 'RHS', 'SR LHS', 'SR RHS'].map(stream => (
                  <label key={stream} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStreams.includes(stream)}
                      onChange={() => handleStreamToggle(stream)}
                      className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{stream}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Chainage (km)</label>
                <input
                  type="number"
                  step="0.001"
                  value={startChainage}
                  onChange={(e) => {
                    setStartChainage(e.target.value);
                    setPreview(null);
                  }}
                  placeholder="e.g. 180.000"
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Chainage (km)</label>
                <input
                  type="number"
                  step="0.001"
                  value={endChainage}
                  onChange={(e) => {
                    setEndChainage(e.target.value);
                    setPreview(null);
                  }}
                  placeholder="e.g. 185.000"
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
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
                  placeholder="e.g. 10"
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end">
              <Premium3DButton
                type="submit"
                disabled={loading || selectedStreams.length === 0}
                className="!w-auto flex items-center justify-center gap-2"
              >
                {loading && !preview ? 'Calculating...' : 'Preview Validation'}
              </Premium3DButton>
            </div>
          </form>
        </div>

        {preview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4 text-green-700 font-bold">
              <MdOutlinePrecisionManufacturing size={20} />
              <h3>Validation Preview</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Coverage Preview</h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Stream</th>
                      <th className="px-4 py-3 font-medium">Distance Covered</th>
                      <th className="px-4 py-3 font-medium">Samples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.streams && preview.streams.map(stream => (
                      <tr key={stream.name}>
                        <td className="px-4 py-3 font-medium text-gray-800">{stream.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {stream.start != null && stream.end != null ? 
                            `${stream.start.toFixed(3)} to ${stream.end.toFixed(3)} km (Actual Coverage: ${(stream.distanceCovered || Math.abs(stream.end - stream.start)).toFixed(3)} km)` : 
                            'No coverage found'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{stream.matchedImages}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold text-gray-800">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{preview.matchedImages}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Target Chainages</div>
                <div className="text-2xl font-bold text-gray-800">{preview.matchedImages}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Images to Reuse</div>
                <div className="text-2xl font-bold text-green-700">{preview.existingImages}</div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="text-xs text-orange-700 font-medium uppercase tracking-wider mb-1">New Extractions</div>
                <div className="text-2xl font-bold text-orange-700">{preview.missingExtractionImages}</div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Total Tasks</div>
                <div className="text-2xl font-bold text-green-700">{preview.totalQuestionInstances}</div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-600">
                This will create a <strong>SINGLE</strong> inspection batch containing <strong>{preview.matchedImages}</strong> tasks across all selected streams. 
                {preview.existingImages > 0 && <span> <strong>{preview.existingImages}</strong> existing images will be directly reused.</span>}
              </div>
              
              <Premium3DButton
                onClick={handleGenerateBatch}
                disabled={loading}
                className="!w-auto flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Batch...' : 'Generate Roadway Batch'}
              </Premium3DButton>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
