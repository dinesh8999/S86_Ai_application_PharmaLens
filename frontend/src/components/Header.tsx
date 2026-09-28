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
    <header className="h-16 bg-white border-b border-powder-200/80 px-6 flex items-center justify-between shrink-0 shadow-xs relative z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-extrabold text-darkteal-900 tracking-tight">{activeTabLabel}</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-powder-50 text-petrol-700 font-bold border border-powder-200">
          Clinical Workspace
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Research Safety Note Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-coral-800 bg-coral-50 px-3 py-1.5 rounded-lg border border-coral-200">
          <AlertCircle className="w-3.5 h-3.5 text-coral-600" />
          <span>Evidence-First · Verified Citations</span>
        </div>

        {/* Health Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isHealthy
              ? 'bg-powder-50 text-petrol-700 border-powder-300'
              : 'bg-coral-50 text-coral-700 border-coral-200'
          }`}
        >
          <Activity className={`w-3.5 h-3.5 ${isHealthy ? 'text-petrol-500 animate-pulse' : 'text-coral-500'}`} />
          <span>{isHealthy ? 'API Connected' : 'Offline'}</span>
        </div>

        {/* User Profile Menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-xl hover:bg-powder-50/60 border border-slate-200 transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-crimson-600 via-coral-500 to-petrol-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  getInitials(user.displayName, user.email)
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 max-w-[130px] truncate leading-tight">
                  {user.displayName || user.email.split('@')[0]}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      user.role === 'ADMIN'
                        ? 'bg-crimson-50 text-crimson-700 border border-crimson-200'
                        : 'bg-powder-100 text-petrol-800 border border-powder-200'
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-powder-200 py-2 text-slate-700 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                  <p className="text-sm font-bold text-darkteal-900 truncate mt-0.5">{user.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        user.role === 'ADMIN'
                          ? 'bg-crimson-50 text-crimson-700 border border-crimson-200'
                          : 'bg-powder-50 text-petrol-700 border border-powder-200'
                      }`}
                    >
                      {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3 text-crimson-600" /> : <User className="w-3 h-3 text-petrol-600" />}
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-coral-600 hover:bg-coral-50 rounded-xl transition-colors cursor-pointer"
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

