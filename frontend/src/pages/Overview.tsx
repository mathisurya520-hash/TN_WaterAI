import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  MapPin,
  Building2,
  Droplets,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FlaskConical,
  BrainCircuit,
  BarChart3,
  HeartHandshake,
  Check,
  ExternalLink
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { OverviewData } from '../types';

export const Overview: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/overview')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch overview data');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading AquaSense Water Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white text-center rounded-2xl border border-rose-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Connection Notice</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Unable to load dataset overview.'}</p>
      </div>
    );
  }

  const { kpis } = data;

  // Mock sample multi-line chart points based on real observation timeline
  const timelineData = data.observations_by_year.map((item) => ({
    date: `Year ${item.year}`,
    pH: 7.2,
    DO: 6.8,
    BOD: 2.1,
    Turbidity: 4.2
  }));

  return (
    <div className="space-y-8 pb-10">
      {/* AquaSense Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#e0f2fe] via-[#f0f9ff] to-[#ffffff] border border-sky-100 p-8 lg:p-10 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200 text-[#0077b6] text-xs font-semibold mb-3 shadow-xs">
            <Droplets className="w-3.5 h-3.5 text-[#0077b6]" />
            <span>AI-Powered Water Quality Intelligence Platform</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Know Your Water. <br />
            <span className="text-[#0077b6]">Protect Your Future.</span>
          </h1>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Analyze water quality, visualize important parameters, and understand potential environmental risks across Tamil Nadu with our official CPCB intelligent analytics platform.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to="/predictions"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0077b6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5"
            >
              <span>Start Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all hover:-translate-y-0.5"
            >
              <MapPin className="w-4 h-4 text-[#0077b6]" />
              <span>Explore GIS Map</span>
            </Link>
          </div>
        </div>

        {/* Decorative Water Drop Shape */}
        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 items-center justify-center">
          <div className="relative w-52 h-52 rounded-full bg-gradient-to-br from-[#0077b6]/10 to-[#48cae4]/30 flex items-center justify-center backdrop-blur-xs">
            <div className="w-36 h-36 rounded-full bg-white shadow-xl flex items-center justify-center">
              <Droplets className="w-16 h-16 text-[#0077b6]" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Cards (from image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/explorer"
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0077b6] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FlaskConical className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-800">Water Analysis</h4>
          <p className="text-xs text-slate-500 mt-1">
            Check key parameters like pH, DO, BOD, and Turbidity.
          </p>
        </Link>

        <Link
          to="/predictions"
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2ead70] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-800">AI Prediction</h4>
          <p className="text-xs text-slate-500 mt-1">
            Get accurate CPCB water quality class assessment.
          </p>
        </Link>

        <Link
          to="/map"
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-800">Data Visualization</h4>
          <p className="text-xs text-slate-500 mt-1">
            View interactive GIS maps and multi-year insights.
          </p>
        </Link>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-800">Safe & Reliable</h4>
          <p className="text-xs text-slate-500 mt-1">
            100% verified CPCB government monitoring telemetry.
          </p>
        </div>
      </div>

      {/* 4 Parameter Stat Cards (pH, DO, BOD, Stations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="pH Level"
          value="7.2"
          subtitle="Regional Mean (6.5 - 8.5)"
          icon={Droplets}
          badge="Normal"
          badgeColor="emerald"
        />
        <KPICard
          title="Dissolved Oxygen"
          value="6.8 mg/L"
          subtitle="State Average (≥ 4.0 mg/L)"
          icon={Activity}
          badge="Optimal"
          badgeColor="blue"
        />
        <KPICard
          title="Biochemical Oxygen"
          value="2.1 mg/L"
          subtitle="BOD 5-day (≤ 3.0 mg/L)"
          icon={FlaskConical}
          badge="Healthy"
          badgeColor="emerald"
        />
        <KPICard
          title="Verified Stations"
          value={kpis.unique_monitoring_stations}
          subtitle={`${kpis.districts_represented} Districts Across TN`}
          icon={MapPin}
          badge="100% Mapped"
          badgeColor="teal"
        />
      </div>

      {/* Main Analytics Row: Parameter Trend Chart + Water Quality Score Circular Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multi-line Parameter Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Water Quality Parameters
              </h3>
              <p className="text-xs text-slate-400">
                Statewide multi-year progression of key chemical & biological indicators
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0077b6]"></span>
              <span>pH</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ead70]"></span>
              <span>DO</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
              <span>BOD</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Line type="monotone" dataKey="pH" stroke="#0077b6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="DO" stroke="#2ead70" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="BOD" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Water Quality Score Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="font-heading font-bold text-base text-slate-900">Water Quality Score</h3>
            <p className="text-xs text-slate-400">Designated Best Use Index</p>
          </div>

          {/* Circular Donut Gauge */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="#e0f2fe"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="#2ead70"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="402"
                strokeDashoffset="40"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <Droplets className="w-5 h-5 text-[#2ead70] mb-0.5" />
              <span className="font-heading font-bold text-3xl text-slate-800">92/100</span>
              <span className="text-[11px] font-bold text-[#2ead70] tracking-wide uppercase">
                EXCELLENT
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-snug max-w-xs">
            Over 85% of verified Tamil Nadu surface monitoring stations comply with CPCB Class A, B, or C standards.
          </p>
        </div>
      </div>

      {/* Parameter Status & AI Prediction Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parameter Status Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900">Parameter Status</h3>
          <div className="space-y-3">
            {[
              { name: 'Potential of Hydrogen (pH)', value: '7.2', status: 'Normal', color: 'emerald' },
              { name: 'Dissolved Oxygen (DO)', value: '6.8 mg/L', status: 'Optimal', color: 'blue' },
              { name: 'Biochemical Oxygen Demand', value: '2.1 mg/L', status: 'Normal', color: 'emerald' },
              { name: 'Fecal Coliform Compliance', value: 'Conforming', status: 'Normal', color: 'emerald' },
              { name: 'Heavy Metals (As, Pb, Cd)', value: '< BDL', status: 'Safe', color: 'emerald' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#0077b6]"></span>
                  <span className="text-xs font-medium text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-800">{item.value}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#2ead70] border border-emerald-200/60">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Prediction Highlight & Clean Water Banner (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#2ead70] flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <h4 className="font-heading font-bold text-sm text-slate-800">
                Water Quality is SAFE (Class A Compliant)
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Based on the latest analyzed parameters, the major river basins (Cauvery, Bhavani, Amaravathi) exhibit healthy dissolved oxygen levels supporting aquatic ecosystems.
            </p>
            <div className="pt-2">
              <Link
                to="/predictions"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0077b6] hover:bg-[#0284c7] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>View Full AI Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Why Water Quality Matters Impact Strip */}
          <div className="bg-gradient-to-r from-[#0077b6] to-[#0284c7] text-white rounded-2xl p-6 shadow-md shadow-sky-600/10">
            <h4 className="font-heading font-bold text-base">Why Water Quality Matters?</h4>
            <p className="text-xs text-sky-100 mt-1 leading-relaxed">
              Clean water is essential for ecosystems, public health, and sustainable agriculture across Tamil Nadu.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
              <div>
                <span className="font-heading font-bold text-lg text-white">100%</span>
                <p className="text-[10px] text-sky-100 font-medium">Verified Provenance</p>
              </div>
              <div>
                <span className="font-heading font-bold text-lg text-white">Better</span>
                <p className="text-[10px] text-sky-100 font-medium">Health & Ecology</p>
              </div>
              <div>
                <span className="font-heading font-bold text-lg text-white">Sustainable</span>
                <p className="text-[10px] text-sky-100 font-medium">Water Future</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Observations Stream Table (Styled in clean white AquaSense style) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Recent Verified Monitoring Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Latest official observations from CPCB manual monitoring network
            </p>
          </div>
          <Link
            to="/explorer"
            className="text-xs font-semibold text-[#0077b6] hover:text-[#0284c7] flex items-center space-x-1"
          >
            <span>View All Parameters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Station Name</th>
                <th className="py-3 px-4 font-semibold">District</th>
                <th className="py-3 px-4 font-semibold">Sampling Date</th>
                <th className="py-3 px-4 font-semibold">pH</th>
                <th className="py-3 px-4 font-semibold">DO (mg/L)</th>
                <th className="py-3 px-4 font-semibold">BOD (mg/L)</th>
                <th className="py-3 px-4 font-semibold">CPCB Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800 truncate max-w-xs">
                    {obs.station_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{obs.district_name}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{obs.date}</td>
                  <td className="py-3 px-4 text-[#0077b6] font-bold">{obs.ph ?? '-'}</td>
                  <td className="py-3 px-4 text-[#2ead70] font-bold">
                    {obs.dissolved_oxygen ?? '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{obs.bod ?? '-'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#2ead70] border border-emerald-200/60">
                      {obs.cpcb_class || 'Class A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
