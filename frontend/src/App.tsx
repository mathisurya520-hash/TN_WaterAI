import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { InteractiveMap } from './pages/InteractiveMap';
import { WaterQualityExplorer } from './pages/WaterQualityExplorer';
import { DistrictAnalytics } from './pages/DistrictAnalytics';
import { MLPredictions } from './pages/MLPredictions';
import { HistoricalTrends } from './pages/HistoricalTrends';
import { CompareLocations } from './pages/CompareLocations';
import { DataSources } from './pages/DataSources';
import { Reports } from './pages/Reports';
import { AboutProject } from './pages/AboutProject';
import { Search, Calendar, UserCheck, Droplet } from 'lucide-react';

export const App: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Router>
      <div className="flex h-screen bg-[#f0f9ff] text-slate-800 overflow-hidden font-sans">
        {/* Sleek Dark Navy Sidebar */}
        <Navbar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar matching AquaSense style */}
          <header className="bg-white border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-20">
            {/* Search Input */}
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search station, district, river..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0077b6] focus:ring-1 focus:ring-[#0077b6] transition-all"
              />
            </div>

            {/* Date & User Status */}
            <div className="flex items-center space-x-5">
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
                <Calendar className="w-3.5 h-3.5 text-[#0077b6]" />
                <span>Today, {currentDate}</span>
              </div>

              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0077b6] to-[#48cae4] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  TN
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-bold text-slate-800">State Officer</div>
                  <div className="flex items-center space-x-1 text-[10px] text-[#2ead70] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ead70]"></span>
                    <span>Verified Online</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page View Container */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f0f9ff]">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/map" element={<InteractiveMap />} />
                <Route path="/explorer" element={<WaterQualityExplorer />} />
                <Route path="/districts" element={<DistrictAnalytics />} />
                <Route path="/predictions" element={<MLPredictions />} />
                <Route path="/trends" element={<HistoricalTrends />} />
                <Route path="/compare" element={<CompareLocations />} />
                <Route path="/sources" element={<DataSources />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/about" element={<AboutProject />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
