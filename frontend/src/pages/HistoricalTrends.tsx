import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  Sliders,
  Filter,
  Layers
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export const HistoricalTrends: React.FC = () => {
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedParam, setSelectedParam] = useState<string>('dissolved_oxygen');
  const [trends, setTrends] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const parameters = [
    { key: 'dissolved_oxygen', name: 'Dissolved Oxygen (DO)', unit: 'mg/L' },
    { key: 'ph', name: 'Potential of Hydrogen (pH)', unit: 'pH' },
    { key: 'bod', name: 'Biochemical Oxygen Demand (BOD)', unit: 'mg/L' },
    { key: 'electrical_conductivity', name: 'Electrical Conductivity (EC)', unit: 'µS/cm' },
    { key: 'fecal_coliform', name: 'Fecal Coliform', unit: 'MPN/100mL' },
    { key: 'turbidity', name: 'Turbidity', unit: 'NTU' }
  ];

  useEffect(() => {
    fetch('/api/districts')
      .then((r) => r.json())
      .then((data) => {
        setDistricts(['All', ...data.map((d: any) => d.name).sort()]);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const distQuery = selectedDistrict !== 'All' ? `&district=${encodeURIComponent(selectedDistrict)}` : '';
    fetch(`/api/analytics/trends?parameter=${selectedParam}${distQuery}`)
      .then((r) => r.json())
      .then((data) => setTrends(data.trends || []))
      .catch((err) => console.error(err));

    fetch(`/api/analytics/anomalies?parameter=${selectedParam}&limit=15`)
      .then((r) => r.json())
      .then((data) => setAnomalies(data || []))
      .catch((err) => console.error(err));
  }, [selectedParam, selectedDistrict]);

  const currentUnit = parameters.find((p) => p.key === selectedParam)?.unit || '';

  return (
    <div className="space-y-6 pb-8">
      {/* Header and Filter Controls */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Time-Series Analytics</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">History & Trends</h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical evolution and statistical outlier detection across Tamil Nadu monitoring cycles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Parameter:</span>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#0077b6]"
            >
              {parameters.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#0077b6]"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900">
              Historical Timeline ({selectedDistrict === 'All' ? 'All Tamil Nadu' : selectedDistrict})
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated measurement values ({currentUnit}) by sampling month
            </p>
          </div>
          <span className="text-xs text-[#0077b6] font-bold font-mono">
            {trends.length} Observation Epochs
          </span>
        </div>

        <div className="h-72">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit={` ${currentUnit}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0077b6"
                  strokeWidth={2.5}
                  name={`Mean ${selectedParam.replace('_', ' ').toUpperCase()}`}
                  dot={{ r: 3, fill: '#0077b6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical trend observations found for this combination.
            </div>
          )}
        </div>
      </div>

      {/* Outlier & Anomaly Detection Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Statistical Anomaly & Outlier Flags
              </h3>
              <p className="text-xs text-slate-400">
                1.5 × Interquartile Range (IQR) outliers requiring review
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {anomalies.length} Flagged
          </span>
        </div>

        {anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Station Name</th>
                  <th className="py-3 px-4 font-semibold">District</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Measured Value</th>
                  <th className="py-3 px-4 font-semibold">Direction</th>
                  <th className="py-3 px-4 font-semibold">IQR Deviation</th>
                  <th className="py-3 px-4 font-semibold">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies.map((anom, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{anom.station_name}</td>
                    <td className="py-3 px-4 text-slate-600">{anom.district_name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {anom.acquisition_time ? anom.acquisition_time.split('T')[0] : '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      {anom.measured_value} {currentUnit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {anom.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      {anom.iqr_deviation}× IQR
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">{anom.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            No extreme anomalies found for {selectedParam}.
          </p>
        )}
      </div>
    </div>
  );
};
