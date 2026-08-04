import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MdAssessment, MdAssignment, MdWarning, MdStar, 
  MdShowChart, MdPieChart, MdTrendingUp, MdCheckCircle 
} from 'react-icons/md';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Treemap, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { dashboardService } from '../../services/dashboard.service';

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-6 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const ProjectIntelligence = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id || projects[0]._id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAnalytics();
    }
  }, [selectedProjectId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [kpiData, chartData] = await Promise.all([
        dashboardService.getProjectKPIs(selectedProjectId),
        dashboardService.getChartsData(selectedProjectId)
      ]);
      setKpis(kpiData);
      setCharts(chartData);
    } catch (err) {
      console.error('Failed to fetch project analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (!projects || projects.length === 0) {
    return <div className="text-center py-12 text-gray-500">No projects available for intelligence.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Project Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MdAssessment className="text-blue-600" /> Select Project to Analyze
        </h2>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id || p._id} value={p.id || p._id}>
              {p.name || p.code}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* KPIs */}
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Tasks"
                value={kpis.totalRatings || 0}
                subtitle="Tasks extracted"
                icon={MdAssignment}
                colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
              />
              <KPICard
                title="Completed Tasks"
                value={kpis.completedRatings || 0}
                subtitle="Images evaluated"
                icon={MdCheckCircle}
                colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
              />
              <KPICard
                title="Critical Issues"
                value={kpis.criticalIssues || 0}
                subtitle="Score <= 5"
                icon={MdWarning}
                colorClass="bg-gradient-to-br from-red-400 to-red-600"
              />
              <KPICard
                title="Perfect 10s"
                value={`${kpis.perfect10Percentage || 0}%`}
                subtitle="Top rated parameters"
                icon={MdStar}
                colorClass="bg-gradient-to-br from-yellow-400 to-yellow-600"
              />
            </div>
          )}

          {/* Charts */}
          {charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                  <MdTrendingUp className="text-gray-400" /> Rating Activity (30 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.ratingTrend || []}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Health Radar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                  <MdShowChart className="text-gray-400" /> Category Health (Avg Score)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={charts.radarData || []}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{fill: '#4b5563', fontSize: 11}} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Project Avg" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Treemap */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                  <MdPieChart className="text-gray-400" /> Asset Distribution
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={charts.treeMapData || []}
                      dataKey="size"
                      aspectRatio={4 / 3}
                      stroke="#fff"
                      fill="#6366f1"
                    >
                      <Tooltip />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectIntelligence;
