import { apiFetch } from "../utils/api";
import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  Trash2,
  Droplets
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Station } from '../types';

export const CompareLocations: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);
  const [stationDetails, setStationDetails] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/stations')
      .then((r) => r.json())
      .then((data) => {
        setStations(data);
        if (data.length >= 2) {
          setSelectedStationIds([data[0].id, data[1].id]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedStationIds.length === 0) {
      setStationDetails([]);
      return;
    }

    Promise.all(
      selectedStationIds.map((id) =>
        apiFetch(`/api/stations/${id}`).then((r) => r.json())
      )
    )
      .then((details) => setStationDetails(details))
      .catch((err) => console.error(err));
  }, [selectedStationIds]);

  const handleAddStation = (id: number) => {
    if (!selectedStationIds.includes(id) && selectedStationIds.length < 4) {
      setSelectedStationIds([...selectedStationIds, id]);
    }
  };

  const handleRemoveStation = (id: number) => {
    setSelectedStationIds(selectedStationIds.filter((sid) => sid !== id));
  };

  const comparisonData = [
    {
      parameter: 'pH (pH units)',
      ...Object.fromEntries(
        stationDetails.map((sd) => [
          sd.station.station_name.slice(0, 18),
          sd.latest_observation?.ph ?? 7.2
        ])
      )
    },
    {
      parameter: 'DO (mg/L)',
      ...Object.fromEntries(
        stationDetails.map((sd) => [
          sd.station.station_name.slice(0, 18),
          sd.latest_observation?.dissolved_oxygen ?? 6.5
        ])
      )
    },
    {
      parameter: 'BOD (mg/L)',
      ...Object.fromEntries(
        stationDetails.map((sd) => [
          sd.station.station_name.slice(0, 18),
          sd.latest_observation?.bod ?? 2.1
        ])
      )
    },
    {
      parameter: 'Turbidity (NTU)',
      ...Object.fromEntries(
        stationDetails.map((sd) => [
          sd.station.station_name.slice(0, 18),
          sd.latest_observation?.turbidity ?? 4.0
        ])
      )
    }
  ];

  const BAR_COLORS = ['#0077b6', '#2ead70', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 pb-8">
      {/* Header and Station Selector */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
          <GitCompare className="w-4 h-4" />
          <span>Multivariate Location Benchmark</span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">Compare Monitoring Stations</h2>
        <p className="text-xs text-slate-500 mt-1">
          Side-by-side benchmark comparison of up to 4 monitoring stations across Tamil Nadu river basins.
        </p>

        {/* Selected Stations Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {stationDetails.map((sd, idx) => (
            <div
              key={sd.station.id}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
              ></span>
              <span className="font-semibold truncate max-w-[180px]">{sd.station.station_name}</span>
              <button
                onClick={() => handleRemoveStation(sd.station.id)}
                className="text-slate-400 hover:text-rose-500 ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedStationIds.length < 4 && (
            <select
              onChange={(e) => {
                if (e.target.value) handleAddStation(Number(e.target.value));
              }}
              value=""
              className="bg-slate-50 border border-slate-200 text-xs text-[#0077b6] font-bold rounded-xl px-3.5 py-1.5 focus:outline-none focus:border-[#0077b6]"
            >
              <option value="">+ Add Station to Compare</option>
              {stations
                .filter((s) => !selectedStationIds.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.station_name} ({s.district_name})
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Comparison Chart */}
      {stationDetails.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-heading text-base font-bold text-slate-900">
            Key Environmental Parameters Comparison
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <XAxis dataKey="parameter" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                {stationDetails.map((sd, idx) => {
                  const key = sd.station.station_name.slice(0, 18);
                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={BAR_COLORS[idx % BAR_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stationDetails.map((sd, idx) => (
          <div
            key={sd.station.id}
            className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
              ></span>
              <h4 className="font-heading font-bold text-slate-900 text-sm truncate leading-snug">
                {sd.station.station_name}
              </h4>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>
                District: <span className="text-slate-900 font-semibold">{sd.station.district_name}</span>
              </div>
              <div>
                Source: <span className="text-[#0077b6] font-semibold">{sd.station.water_source_category}</span>
              </div>
              <div>
                River / Basin:{' '}
                <span className="text-slate-800">
                  {sd.station.river}
                </span>
              </div>
              <div>
                Total Records:{' '}
                <span className="text-slate-900 font-mono font-bold">{sd.station.total_records}</span>
              </div>
            </div>

            {/* Latest Measurements */}
            <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Latest Sampling
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700 font-mono text-[11px]">
                  {sd.latest_observation?.date || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">pH:</span>
                <span className="text-[#0077b6] font-bold">{sd.latest_observation?.ph ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DO:</span>
                <span className="text-[#2ead70] font-bold">
                  {sd.latest_observation?.dissolved_oxygen ? `${sd.latest_observation.dissolved_oxygen} mg/L` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BOD:</span>
                <span className="text-slate-800 font-bold">
                  {sd.latest_observation?.bod ? `${sd.latest_observation.bod} mg/L` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CPCB Class:</span>
                <span className="text-[#2ead70] font-bold">
                  {sd.latest_observation?.cpcb_class || 'Class A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
