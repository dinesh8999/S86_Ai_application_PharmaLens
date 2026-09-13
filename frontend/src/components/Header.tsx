import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, Activity, User } from 'lucide-react';
import { checkHealth } from '../services/api';

interface HeaderProps {
  title: string;
  onSearchQuery?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onSearchQuery }) => {
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    checkHealth().then(setIsHealthy);
    const interval = setInterval(() => {
      checkHealth().then(setIsHealthy);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Grounded RAG Mode</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health Badge */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border bg-slate-50">
          <Activity className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="text-slate-600 font-medium hidden md:inline">Backend API:</span>
          <span className={`font-semibold ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isHealthy ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm border border-blue-200">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-slate-800">Dr. Sarah Jenkins</p>
            <p className="text-slate-500">Lead Pharma Researcher</p>
          </div>
        </div>
      </div>
    </header>
  );
};
