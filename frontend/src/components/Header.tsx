import React, { useState, useRef, useEffect } from 'react';
import { Activity, AlertCircle, User, LogOut, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  isHealthy: boolean;
  activeTabLabel: string;
}

export const Header: React.FC<HeaderProps> = ({ isHealthy, activeTabLabel }) => {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'CR';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm relative z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{activeTabLabel}</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
          Clinical Workspace
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Research Safety Note Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Evidence-First · Verified Citations</span>
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

        {/* User Profile Menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  getInitials(user.displayName, user.email)
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 max-w-[130px] truncate leading-tight">
                  {user.displayName || user.email.split('@')[0]}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      user.role === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 text-slate-700 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{user.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        user.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {user.role === 'ADMIN' ? 'Compliance Administrator' : 'Clinical Investigator'}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
