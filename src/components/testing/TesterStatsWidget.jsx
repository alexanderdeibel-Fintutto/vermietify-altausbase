import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Clock, AlertCircle, Zap } from 'lucide-react';

export default function TesterStatsWidget({ stats = {} }) {
  const statCards = [
    {
      icon: Users,
      label: 'Aktive Tester',
      value: stats.active_testers || 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Clock,
      label: 'Test-Sessions',
      value: stats.total_sessions || 0,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      icon: AlertCircle,
      label: 'Probleme gemeldet',
      value: stats.total_problems_reported || 0,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      icon: Zap,
      label: 'Seiten besucht',
      value: stats.total_pages_visited || 0,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="p-4 border border-slate-100">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xs font-light text-slate-500 tracking-wide">{stat.label}</p>
            <p className="text-2xl font-light text-slate-800 mt-2">{stat.value}</p>
          </Card>
        );
      })}
    </div>
  );
}