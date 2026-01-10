import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, CheckCircle2, XCircle, Zap, Clock, Activity } from 'lucide-react';

export default function WorkflowMetricsCards({ metrics }) {
  const cards = [
    {
      title: 'Gesamt Ausführungen',
      value: metrics.total_executions,
      icon: Activity,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Erfolgreich',
      value: metrics.completed_executions,
      icon: CheckCircle2,
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Fehlgeschlagen',
      value: metrics.failed_executions,
      icon: XCircle,
      color: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: 'Erfolgsquote',
      value: `${metrics.success_rate}%`,
      icon: TrendingUp,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Ø Ausführungszeit',
      value: `${metrics.average_duration_seconds}s`,
      icon: Clock,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Aktive Workflows',
      value: metrics.active_workflows,
      icon: Zap,
      color: 'bg-amber-50',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={card.color}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">{card.title}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${card.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}