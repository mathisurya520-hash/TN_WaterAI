import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [summaryReport, setSummaryReport] = useState<any>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/summary').then((r) => r.json()),
      fetch('/api/districts').then((r) => r.json())
    ])
      .then(([summary, dists]) => {
        setSummaryReport(summary);
        setDistricts(['All', ...dists.map((d: any) => d.name).sort()]);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDownloadCSV = () => {
    let url = '/api/reports/export-csv?';
    if (selectedDistrict !== 'All') url += `district=${encodeURIComponent(selectedDistrict)}&`;
    if (selectedClass !== 'All') url += `cpcb_class=${encodeURIComponent(selectedClass)}&`;
    if (selectedYear !== 'All') url += `year=${selectedYear}&`;
    window.location.href = url;
  };

  const handlePrint = () => {
    window.print();
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
      {/* Header and Quick Actions */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Environmental Compliance & Analytical Reports</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">Reports & Data Exports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate custom filtered water quality datasets, printable analytical digests, and regulatory summaries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-[#0077b6]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0077b6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Builder for CSV Export */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
        <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">
          Query Filters for Custom Export
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0077b6]"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">CPCB Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0077b6]"
            >
              <option value="All">All Quality Classes</option>
              <option value="Class A">Class A (Drinking without treatment)</option>
              <option value="Class B">Class B (Outdoor Bathing)</option>
              <option value="Class C">Class C (Treated Drinking)</option>
              <option value="Class D">Class D (Wildlife & Fisheries)</option>
              <option value="Class E">Class E (Irrigation)</option>
              <option value="Below Class E">Below Class E (Non-Conforming)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Epoch Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0077b6]"
            >
              <option value="All">All Epoch Years</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Analytical Executive Summary Report */}
      {summaryReport && (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none">
          <div className="border-b border-slate-100 pb-5">
            <span className="text-xs font-bold text-[#0077b6] uppercase tracking-widest">
              Statewide Environmental Report
            </span>
            <h3 className="font-heading text-2xl font-extrabold text-slate-900 mt-1">
              {summaryReport.report_title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span>Coverage: {summaryReport.spatial_coverage}</span>
              <span>•</span>
              <span>Epoch: {summaryReport.temporal_coverage}</span>
              <span>•</span>
              <span>Generated: {summaryReport.generated_at?.split('T')[0]}</span>
            </div>
          </div>

          {/* Core Regional Indicators */}
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              1. Statewide Core Water Quality Indicators
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Mean pH</span>
                <p className="font-heading text-2xl font-bold text-slate-800 mt-1">
                  {summaryReport.regional_indicators?.mean_ph}
                </p>
                <span className="text-[10px] text-slate-400">CPCB Normal Band: 6.5 - 8.5</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Mean Dissolved Oxygen</span>
                <p className="font-heading text-2xl font-bold text-[#0077b6] mt-1">
                  {summaryReport.regional_indicators?.mean_dissolved_oxygen_mg_l} mg/L
                </p>
                <span className="text-[10px] text-slate-400">CPCB Minimum Standard: ≥ 4.0 mg/L</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Mean Biochemical Oxygen Demand</span>
                <p className="font-heading text-2xl font-bold text-slate-800 mt-1">
                  {summaryReport.regional_indicators?.mean_bod_mg_l} mg/L
                </p>
                <span className="text-[10px] text-slate-400">Bathing / Treated Standard: ≤ 3.0 mg/L</span>
              </div>
            </div>
          </div>

          {/* CPCB Class Distribution */}
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              2. Designated Best Use Classification Breakdown
            </h4>
            <div className="space-y-2">
              {summaryReport.cpcb_water_quality_classification_breakdown?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-bold text-slate-700">{item.class_name}</span>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[#0077b6] font-bold">
                      {item.record_count} observations
                    </span>
                    <span className="text-slate-400 font-mono font-medium">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology & Governance Statements */}
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div>
              <strong className="text-slate-700">Methodology: </strong>
              {summaryReport.methodology}
            </div>
            <div>
              <strong className="text-slate-700">Scientific Notice: </strong>
              {summaryReport.scientific_disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
