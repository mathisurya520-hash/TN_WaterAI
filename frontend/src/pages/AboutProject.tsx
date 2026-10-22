import React from 'react';
import {
  BookOpen,
  Award,
  Database,
  ShieldCheck
} from 'lucide-react';

export const AboutProject: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Title Hero */}
      <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0077b6] text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific Documentation & Methodology</span>
        </div>
        <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
          About Tamil Nadu Water Intelligence AI
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          TN-WaterAI (AquaSense) is an environmental intelligence and geospatial monitoring platform engineered to enable data-driven research, public transparency, and decision support regarding surface water, reservoirs, groundwater, and coastal waters across Tamil Nadu, India.
        </p>
      </div>

      {/* CPCB Designated Best Use Standards Reference Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#0077b6]" />
          <h3 className="font-heading text-base font-bold text-slate-900">
            CPCB Primary Water Quality Criteria for Designated Best Use
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Central Pollution Control Board (CPCB) of India categorizes surface waters into five designated best use classes (A to E) based on critical environmental parameters:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Class</th>
                <th className="py-3 px-4 font-bold">Designated Best Use</th>
                <th className="py-3 px-4 font-bold">Primary Standard Criteria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-bold text-[#2ead70]">Class A</td>
                <td className="py-3 px-4 text-slate-800 font-semibold">Drinking without conventional treatment (disinfection only)</td>
                <td className="py-3 px-4 text-slate-600">
                  pH: 6.5–8.5 • DO ≥ 6 mg/L • BOD ≤ 2 mg/L • Total Coliform ≤ 50 MPN/100mL
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#0284c7]">Class B</td>
                <td className="py-3 px-4 text-slate-800 font-semibold">Outdoor bathing (Organized)</td>
                <td className="py-3 px-4 text-slate-600">
                  pH: 6.5–8.5 • DO ≥ 5 mg/L • BOD ≤ 3 mg/L • Total Coliform ≤ 500 MPN/100mL
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-amber-500">Class C</td>
                <td className="py-3 px-4 text-slate-800 font-semibold">Drinking water source after conventional treatment</td>
                <td className="py-3 px-4 text-slate-600">
                  pH: 6.0–9.0 • DO ≥ 4 mg/L • BOD ≤ 3 mg/L • Total Coliform ≤ 5000 MPN/100mL
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-orange-500">Class D</td>
                <td className="py-3 px-4 text-slate-800 font-semibold">Propagation of Wildlife and Fisheries</td>
                <td className="py-3 px-4 text-slate-600">
                  pH: 6.5–8.5 • DO ≥ 4 mg/L • Free Ammonia ≤ 1.2 mg/L
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-violet-600">Class E</td>
                <td className="py-3 px-4 text-slate-800 font-semibold">Irrigation, Industrial Cooling, Controlled Waste disposal</td>
                <td className="py-3 px-4 text-slate-600">
                  pH: 6.0–8.5 • EC ≤ 2250 µS/cm • Sodium Adsorption Ratio ≤ 26
                </td>
              </tr>
              <tr className="bg-rose-50/40">
                <td className="py-3 px-4 font-bold text-rose-600">Below Class E</td>
                <td className="py-3 px-4 text-slate-800 font-semibold">Non-conforming / Heavily polluted water</td>
                <td className="py-3 px-4 text-slate-600">
                  Fails basic thresholds (DO &lt; 2 mg/L, BOD &gt; 15 mg/L, or extreme pH)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Data Provenance */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-[#0077b6]" />
          <h3 className="font-heading text-base font-bold text-slate-900">Official Government Data Sources</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          The records presented in this application are directly sourced from the National Water Informatics Centre (NWIC), Ministry of Jal Shakti, Government of India, and the Central Pollution Control Board (CPCB):
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
          <li>
            <strong>Surface Water Quality (Manual - Chemical Parameters):</strong> NWDP CPCB Tamil Nadu Dataset (1961–2020, 2021–2025).
          </li>
          <li>
            <strong>Surface Water Quality (Manual - Physical Parameters):</strong> NWDP CPCB Tamil Nadu Dataset.
          </li>
          <li>
            <strong>Surface Water Quality (Manual - Biological Parameters):</strong> NWDP CPCB Tamil Nadu Dataset.
          </li>
          <li>
            <strong>District Boundaries:</strong> Verified Tamil Nadu 32 Administrative Boundaries GeoJSON.
          </li>
        </ul>
      </div>

      {/* Responsible Use Statement */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#0077b6]" />
          <h3 className="font-heading text-base font-bold text-slate-900">Responsible-Use Statement & Limitations</h3>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed space-y-2">
          <p>
            1. <strong>Intended Purpose:</strong> TN-WaterAI is designed for academic research, environmental education, ecological trend visualization, and policy decision support.
          </p>
          <p>
            2. <strong>Non-Certification Notice:</strong> This platform does <em>not</em> represent an official municipal drinking water certification portal. Water safety for human consumption must always adhere to statutory laboratory water tests under Bureau of Indian Standards (IS 10500:2012).
          </p>
          <p>
            3. <strong>Data Authenticity:</strong> No monitoring stations, chemical values, or geographic coordinates are fabricated. When measurements are unavailable in historical government batches, they are represented accurately as unrecorded rather than simulated.
          </p>
        </div>
      </div>
    </div>
  );
};
