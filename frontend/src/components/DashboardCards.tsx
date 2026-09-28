import React from 'react';
import { FileText, Search, Zap, DollarSign, Target } from 'lucide-react';
import { UsageReport } from '../types';

interface DashboardCardsProps {
  documentCount: number;
  usage: UsageReport | null;
  onNavigate: (tab: any) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  documentCount,
  usage,
  onNavigate,
}) => {
  const cards = [
    {
      title: 'Indexed Documents',
      value: documentCount.toString(),
      subtext: 'Clinical reports & bulletins',
      icon: <FileText className="w-6 h-6 text-petrol-600" />,
      bgColor: 'bg-powder-50',
      borderColor: 'border-powder-200',
      tab: 'documents',
    },
    {
      title: 'Research Queries',
      value: (usage?.total_requests || 0).toString(),
      subtext: 'Grounded RAG questions',
      icon: <Search className="w-6 h-6 text-coral-600" />,
      bgColor: 'bg-coral-50',
      borderColor: 'border-coral-200',
      tab: 'assistant',
    },
    {
      title: 'Cache Hit Rate',
      value: `${((usage?.cache_hit_rate || 0) * 100).toFixed(0)}%`,
      subtext: `${usage?.cache_hits || 0} cached hits`,
      icon: <Zap className="w-6 h-6 text-crimson-600" />,
      bgColor: 'bg-crimson-50',
      borderColor: 'border-crimson-200',
      tab: 'monitoring',
    },
    {
      title: 'Estimated API Cost',
      value: `$${(usage?.total_estimated_cost || 0).toFixed(4)}`,
      subtext: `${(usage?.total_input_tokens || 0) + (usage?.total_output_tokens || 0)} tokens`,
      icon: <DollarSign className="w-6 h-6 text-petrol-600" />,
      bgColor: 'bg-powder-100',
      borderColor: 'border-powder-300',
      tab: 'monitoring',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          onClick={() => onNavigate(card.tab)}
          className={`p-5 rounded-2xl bg-white border ${card.borderColor} shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2.5 rounded-xl ${card.bgColor}`}>{card.icon}</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-darkteal-900 mb-1">{card.value}</div>
            <div className="text-xs text-slate-500">{card.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

