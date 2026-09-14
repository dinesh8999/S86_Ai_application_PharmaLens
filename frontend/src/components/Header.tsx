import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';

interface HeaderProps {
  isHealthy: boolean;
  activeTabLabel: string;
}

export const Header: React.FC<HeaderProps> = ({ isHealthy, activeTabLabel }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{activeTabLabel}</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
          Research Preview
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Research Safety Note Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Clinical Research Support</span>
        </div>

        {/* Health Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isHealthy
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <Activity className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
          <span>{isHealthy ? 'API Connected' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
