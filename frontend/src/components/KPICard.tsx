import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'teal' | 'emerald' | 'amber' | 'blue' | 'red';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'blue'
}) => {
  const badgeStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200/60',
    emerald: 'bg-emerald-50 text-[#2ead70] border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    blue: 'bg-sky-50 text-[#0077b6] border-sky-200/60',
    red: 'bg-rose-50 text-rose-600 border-rose-200/60'
  };

  const iconBgStyles = {
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-[#2ead70]',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-sky-50 text-[#0077b6]',
    red: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1 font-heading tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${iconBgStyles[badgeColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};
