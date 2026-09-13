import React from 'react';
import {
  LayoutDashboard,
  Search,
  FileText,
  CheckCircle2,
  BarChart3,
  Settings,
  Dna,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'assistant'
  | 'documents'
  | 'evaluation'
  | 'monitoring'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'assistant', label: 'Research Assistant', icon: <Search className="w-5 h-5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'evaluation', label: 'Evaluation', icon: <CheckCircle2 className="w-5 h-5" /> },
    { id: 'monitoring', label: 'Usage Monitoring', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
          <Dna className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">PharmaLens</h1>
          <p className="text-xs text-blue-400 font-medium">Clinical RAG Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 m-3 bg-slate-850 rounded-xl border border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-1 text-slate-300 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Qdrant RAG Active
        </div>
        <p className="text-slate-500 text-[11px]">Zero-Hallucination Grounded Engine</p>
      </div>
    </aside>
  );
};
