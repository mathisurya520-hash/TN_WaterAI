import { apiFetch } from "../utils/api";
import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { ParameterMeta } from '../types';

export const WaterQualityExplorer: React.FC = () => {
  const [parameters, setParameters] = useState<ParameterMeta[]>([]);
  const [selectedParamKey, setSelectedParamKey] = useState<string>('dissolved_oxygen');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/parameters')
      .then((r) => r.json())
      .then((data) => {
        setParameters(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedParamKey) return;

    // Fetch trend
    apiFetch(`/api/analytics/trends?parameter=${selectedParamKey}`)
      .then((r) => r.json())
      .then((data) => setTrendData(data.trends || []))
      .catch((err) => console.error(err));

    // Fetch anomalies for this parameter
    apiFetch(`/api/analytics/anomalies?parameter=${selectedParamKey}&limit=10`)
      .then((r) => r.json())
      .then((data) => setAnomalies(data || []))
      .catch((err) => console.error(err));
  }, [selectedParamKey]);

  const currentParam = parameters.find((p) => p.key === selectedParamKey) || parameters[0];

  const handleExportCSV = () => {
    window.location.href = `/api/reports/export-csv`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header and Parameter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Water Quality Explorer</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">Chemical & Biological Telemetry</h2>
          <p className="text-xs text-slate-500 mt-1">
            Explore parameters across Tamil Nadu monitoring stations based on verified CPCB data.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedParamKey}
            onChange={(e) => setSelectedParamKey(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0077b6] w-full sm:w-64"
          >
            {parameters.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0077b6] hover:bg-[#0284c7] text-white text-xs font-bold whitespace-nowrap shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Parameter Metric Scorecard */}
      {currentParam && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Valid Samples</span>
            <p className="text-xl font-heading font-bold text-slate-800 mt-1">
              {currentParam.observation_count.toLocaleString()}
            </p>
            <span className="text-[10px] text-[#0077b6] font-medium">Recorded Samples</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Missing Rate</span>
            <p className="text-xl font-heading font-bold text-amber-500 mt-1">
              {currentParam.missing_percentage}%
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Unrecorded in batch</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Minimum</span>
            <p className="text-xl font-heading font-bold text-slate-800 mt-1">
              {currentParam.min !== null ? `${currentParam.min}` : '-'}
            </p>
            <span className="text-[10px] text-slate-400">{currentParam.unit}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Median</span>
            <p className="text-xl font-heading font-bold text-[#0077b6] mt-1">
              {currentParam.median !== null ? `${currentParam.median}` : '-'}
            </p>
            <span className="text-[10px] text-slate-400">50th percentile</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Mean (Average)</span>
            <p className="text-xl font-heading font-bold text-slate-800 mt-1">
              {currentParam.mean !== null ? `${currentParam.mean}` : '-'}
            </p>
            <span className="text-[10px] text-slate-400">Std: {currentParam.std ?? '-'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Maximum</span>
            <p className="text-xl font-heading font-bold text-rose-500 mt-1">
              {currentParam.max !== null ? `${currentParam.max}` : '-'}
            </p>
            <span className="text-[10px] text-slate-400">{currentParam.unit}</span>
          </div>
        </div>
      )}

      {/* Main Charts: Parameter Historical Evolution */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900">
              {currentParam?.name} Monthly Trend Evolution
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated statewide averages across Tamil Nadu river and surface water monitoring stations
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-sky-50 text-[#0077b6] font-semibold text-xs border border-sky-200">
            CPCB Benchmark: {currentParam?.standard}
          </div>
        </div>

        <div className="h-72">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValueAqua" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077b6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0077b6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit={` ${currentParam?.unit || ''}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0077b6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorValueAqua)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No continuous monthly time-series points available for this parameter.
            </div>
          )}
        </div>
      </div>

      {/* Statistical Outliers & Anomalies Review Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-heading text-sm font-bold text-slate-900">
              Potential Outliers & Statistical Anomalies ({currentParam?.name})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Computed via 1.5 × Interquartile Range (IQR) rule
          </span>
        </div>

        {anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Station</th>
                  <th className="py-3 px-4 font-semibold">District</th>
                  <th className="py-3 px-4 font-semibold">Measured Value</th>
                  <th className="py-3 px-4 font-semibold">Regional Baseline</th>
                  <th className="py-3 px-4 font-semibold">IQR Deviation</th>
                  <th className="py-3 px-4 font-semibold">Context & Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies.map((anom, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{anom.station_name}</td>
                    <td className="py-3 px-4 text-slate-600">{anom.district_name}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      {anom.measured_value} {currentParam.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      [{anom.normal_range[0]} - {anom.normal_range[1]}]
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      {anom.iqr_deviation}× IQR
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{anom.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            No extreme statistical outliers detected for {currentParam?.name} in the current dataset.
          </p>
        )}
      </div>
    </div>
  );
};
