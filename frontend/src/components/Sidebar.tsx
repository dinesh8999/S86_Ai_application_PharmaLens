import React from 'react';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  FileText,
  Dna,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'assistant' | 'studies' | 'documents';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth();

  const primaryItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'assistant', label: 'Research Assistant', icon: <Search className="w-5 h-5" /> },
    { id: 'studies', label: 'Studies', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-darkteal-900 text-slate-300 flex flex-col h-screen border-r border-darkteal-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-darkteal-800">
        <div className="p-2.5 bg-gradient-to-tr from-crimson-600 via-coral-500 to-petrol-500 rounded-xl text-white shadow-lg shadow-crimson-600/30">
          <Dna className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-wide">PharmaLens</h1>
          <p className="text-xs text-powder-300 font-medium">Clinical Research Assistant</p>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-bold text-powder-300/60 uppercase tracking-wider mb-2">
          Clinical Workspace
        </div>
        {primaryItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-petrol-500 to-petrol-600 text-white shadow-md shadow-petrol-500/30 border border-powder-300/30'
                  : 'text-slate-300 hover:text-white hover:bg-darkteal-800/70'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Indicator */}
      <div className="p-4 m-3 bg-darkteal-950/80 rounded-xl border border-darkteal-800 text-xs text-slate-300">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-powder-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-powder-300 animate-ping"></span>
            <span>Qdrant Active</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-darkteal-800 text-powder-200 font-mono font-bold border border-darkteal-700">
            {user?.role || 'RESEARCHER'}
          </span>
        </div>
        <p className="text-slate-400 text-[11px]">Evidence-First RAG · 632 Chunks</p>
      </div>
    </aside>
  );
};

export default Sidebar;

