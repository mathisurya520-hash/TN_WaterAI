import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  FlaskConical,
  Building2,
  BrainCircuit,
  TrendingUp,
  GitCompare,
  Database,
  FileSpreadsheet,
  Info,
  Droplets,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Interactive Map', icon: MapPin },
  { path: '/explorer', label: 'Water Analysis', icon: FlaskConical },
  { path: '/districts', label: 'District Analytics', icon: Building2 },
  { path: '/predictions', label: 'AI Prediction', icon: BrainCircuit },
  { path: '/trends', label: 'History & Trends', icon: TrendingUp },
  { path: '/compare', label: 'Compare Locations', icon: GitCompare },
  { path: '/sources', label: 'Data Sources', icon: Database },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { path: '/about', label: 'About & Standards', icon: Info },
];

export const Navbar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#0a1e36] text-white flex flex-col h-screen sticky top-0 select-none flex-shrink-0 border-r border-[#16324f] shadow-2xl z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#16324f]/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0077b6] via-[#0096c7] to-[#48cae4] flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg tracking-tight text-white leading-tight">
              AquaSense
            </h1>
            <p className="text-[11px] text-[#48cae4] font-medium tracking-wide">
              TN Water Intelligence AI
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0077b6] text-white shadow-md shadow-blue-900/40 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#16324f]/80 bg-[#071628]/60">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#2ead70] animate-pulse"></span>
            <span className="text-slate-200 font-medium">CPCB Verified</span>
          </div>
          <span className="text-[#48cae4] font-mono text-[11px]">v1.0 Live</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          3,191 Records • 134 Stations
        </p>
      </div>
    </aside>
  );
};
