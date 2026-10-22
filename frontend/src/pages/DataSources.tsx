import React, { useEffect, useState } from 'react';
import {
  Database,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { DataSourceItem } from '../types';

export const DataSources: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [importLogs, setImportLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSourceName, setUploadSourceName] = useState('TNPCB Manual Station Ingestion');
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = () => {
    fetch('/api/sources')
      .then((r) => r.json())
      .then((data) => {
        setSources(data.sources || []);
        setImportLogs(data.recent_import_logs || []);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('source_name', uploadSourceName);

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      setUploadStatus(json);
      fetchSources();
    } catch (err: any) {
      setUploadStatus({ status: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
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
      {/* Header */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
          <Database className="w-4 h-4" />
          <span>Official Provenance & Ingestion Engine</span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">Data Source Registry</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Verifiable government environmental datasets ingested from the National Water Data Portal (NWDP / NWIC), Central Pollution Control Board (CPCB), and Tamil Nadu Pollution Control Board (TNPCB).
        </p>
      </div>

      {/* Verified Official Sources Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-slate-900">
            Registered Government Datasets
          </h3>
          <span className="text-xs text-[#0077b6] font-mono font-bold">
            {sources.length} Verified Sources Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Dataset Name</th>
                <th className="py-3 px-4 font-semibold">Publisher</th>
                <th className="py-3 px-4 font-semibold">Epoch</th>
                <th className="py-3 px-4 font-semibold">Format</th>
                <th className="py-3 px-4 font-semibold">Accepted</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Official Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.publisher}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {s.temporal_coverage}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0077b6] font-bold text-[10px] border border-slate-200">
                      {s.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#2ead70] font-bold font-mono">
                    {s.records_accepted.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 text-[#2ead70] text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{s.validation_status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[#0077b6] hover:text-[#0284c7] font-semibold"
                    >
                      <span>Portal Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Authorized Ingestion Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-[#0077b6]" />
            <h3 className="font-heading text-base font-bold text-slate-900">
              Dataset Upload Pipeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload CSV/XLSX station files from CPCB, TNPCB, or NWIC for schema validation, coordinate checks, and insertion into the database.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Entity / Attribution
              </label>
              <input
                type="text"
                value={uploadSourceName}
                onChange={(e) => setUploadSourceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0077b6]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select CSV / Excel File
              </label>
              <input
                type="file"
                accept=".csv,.txt,.xlsx"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0077b6] file:text-white hover:file:bg-[#0284c7] cursor-pointer"
                required
              />
            </div>

            {uploadStatus && (
              <div
                className={`p-3.5 rounded-2xl border text-xs ${
                  uploadStatus.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <div className="font-bold">{uploadStatus.message}</div>
                {uploadStatus.records_accepted !== undefined && (
                  <div className="text-[11px] text-slate-600 mt-1">
                    Accepted: {uploadStatus.records_accepted} • Rejected: {uploadStatus.records_rejected}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-[#0077b6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Ingesting...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Execute Ingestion</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Ingestion Logs */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#0077b6]" />
            <h3 className="font-heading text-base font-bold text-slate-900">
              Recent Ingestion Logs
            </h3>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {importLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{log.source_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-slate-500 text-[11px]">File: {log.filename}</div>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-[#2ead70] font-bold">
                    Accepted: {log.records_imported}
                  </span>
                  <span className="text-slate-400">Rejected: {log.records_rejected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
