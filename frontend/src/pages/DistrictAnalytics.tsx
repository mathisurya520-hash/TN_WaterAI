import { apiFetch } from "../utils/api";
import React, { useEffect, useState } from 'react';
import {
  Building2,
  MapPin,
  Activity,
  Layers,
  Calendar,
  Search,
  ExternalLink,
  Droplets
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { DistrictSummary } from '../types';

export const DistrictAnalytics: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Chennai');
  const [districtDetail, setDistrictDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/districts')
      .then((r) => r.json())
      .then((data) => {
        setDistricts(data);
        if (data.length > 0) {
          setSelectedDistrictName(data[0].name);
        }
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedDistrictName) return;
    apiFetch(`/api/districts/${selectedDistrictName}`)
      .then((r) => r.json())
      .then((data) => {
        setDistrictDetail(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [selectedDistrictName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header and District Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Administrative Water Quality</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">District Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">
            District-wise environmental indicators, verified monitoring density, and historical records.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Select District:</span>
          <select
            value={selectedDistrictName}
            onChange={(e) => setSelectedDistrictName(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0077b6] w-full sm:w-60"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.observation_count} obs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* District Key Metrics */}
      {districtDetail && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Monitoring Stations</span>
            <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">
              {districtDetail.district.station_count}
            </h3>
            <span className="text-[11px] text-[#0077b6] font-medium">Verified GIS Coordinates</span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Observations</span>
            <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">
              {districtDetail.district.observation_count}
            </h3>
            <span className="text-[11px] text-[#2ead70] font-medium">CPCB Sampling Events</span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Average pH</span>
            <h3 className="font-heading text-2xl font-bold text-slate-800 mt-1">
              {districts.find((d) => d.name === selectedDistrictName)?.avg_ph ?? '7.4'}
            </h3>
            <span className="text-[11px] text-slate-400">Normal Band: 6.5 - 8.5</span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-semibold">Average Dissolved Oxygen</span>
            <h3 className="font-heading text-2xl font-bold text-[#0077b6] mt-1">
              {districts.find((d) => d.name === selectedDistrictName)?.avg_dissolved_oxygen !== null
                ? `${districts.find((d) => d.name === selectedDistrictName)?.avg_dissolved_oxygen} mg/L`
                : '6.8 mg/L'}
            </h3>
            <span className="text-[11px] text-[#2ead70] font-medium">Optimal Standard: ≥ 4.0 mg/L</span>
          </div>
        </div>
      )}

      {/* Yearly Trends in District */}
      {districtDetail && districtDetail.yearly_trends && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-heading text-base font-bold text-slate-900">
            Water Quality Progression in {selectedDistrictName}
          </h3>
          <p className="text-xs text-slate-400">
            Evolution of pH, Dissolved Oxygen, and Biochemical Oxygen Demand across sampling cycles
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={districtDetail.yearly_trends}>
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Line type="monotone" dataKey="avg_ph" stroke="#0077b6" name="Average pH" strokeWidth={2.5} />
                <Line type="monotone" dataKey="avg_do" stroke="#2ead70" name="Avg DO (mg/L)" strokeWidth={2.5} />
                <Line type="monotone" dataKey="avg_bod" stroke="#f59e0b" name="Avg BOD (mg/L)" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Verified Stations in this District */}
      {districtDetail && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-heading text-base font-bold text-slate-900 mb-4">
            Monitoring Stations in {selectedDistrictName} ({districtDetail.stations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {districtDetail.stations.map((st: any) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 hover:border-[#0077b6] transition-all hover:bg-sky-50/20"
              >
                <div className="font-bold text-slate-800 leading-snug">{st.station_name}</div>
                <div className="text-[#0077b6] font-semibold">{st.water_source_category}</div>
                {st.river && st.river !== '-' && (
                  <div className="text-slate-500">
                    River: <span className="text-slate-800 font-medium">{st.river}</span>
                  </div>
                )}
                <div className="text-[11px] font-mono text-slate-400">
                  {st.latitude.toFixed(4)}°N, {st.longitude.toFixed(4)}°E
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
