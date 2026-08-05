import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSkipNext, MdInfoOutline, MdWarning } from 'react-icons/md';
import { dashboardService } from '../../services/dashboard.service';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SkipAnalytics = ({ selectedProject }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSkipAnalytics(selectedProject);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch skip analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#5cb85c] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-3 text-sm font-medium">Loading Skip Analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  // Doughnut Chart for Skip Reasons
  const reasonChartData = {
    labels: data.reasonDistribution.map(r => r.reason),
    datasets: [
      {
        data: data.reasonDistribution.map(r => r.count),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#E7E9ED',
          '#71B37C',
          '#EC932F',
          '#71B37C'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Bar Chart for Inspector Skip Counts
  const inspectorChartData = {
    labels: data.inspectorCounts.map(i => i.inspector),
    datasets: [
      {
        label: 'Skipped Tasks',
        data: data.inspectorCounts.map(i => i.count),
        backgroundColor: 'rgba(92, 184, 92, 0.6)',
        borderColor: 'rgba(92, 184, 92, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdSkipNext className="text-[#5cb85c] text-xl" />
          <h3 className="text-gray-900 font-semibold text-base">Skip Analytics</h3>
        </div>
      </div>

      <div className="p-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium mb-1">Total Skipped</p>
              <h4 className="text-2xl font-bold text-orange-900">{data.totalSkipped}</h4>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <MdWarning className="text-orange-600 text-2xl" />
            </div>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Skip Rate</p>
              <h4 className="text-2xl font-bold text-blue-900">{data.skipRate}%</h4>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MdInfoOutline className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">Top Skip Reasons</h4>
            <div className="h-[250px] flex justify-center">
              {data.reasonDistribution.length > 0 ? (
                <Doughnut
                  data={reasonChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
                    }
                  }}
                />
              ) : (
                <p className="text-gray-400 text-sm mt-10">No skips recorded.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">Skips by Inspector</h4>
            <div className="h-[250px] flex justify-center">
              {data.inspectorCounts.length > 0 ? (
                <Bar
                  data={inspectorChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 } }
                    }
                  }}
                />
              ) : (
                <p className="text-gray-400 text-sm mt-10">No skips recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkipAnalytics;
