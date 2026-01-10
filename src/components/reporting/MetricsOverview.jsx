import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, Zap, Users } from 'lucide-react';

export default function MetricsOverview({ metrics }) {
  const cards = [
    {
      label: 'Dokumente',
      value: metrics?.total_documents || 0,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50'
    },
    {
      label: 'Aufgaben',
      value: metrics?.total_tasks || 0,
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      color: 'bg-green-50'
    },
    {
      label: 'Workflow-Regeln',
      value: metrics?.total_rules || 0,
      icon: <Zap className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50'
    },
    {
      label: 'Aktive Benutzer',
      value: metrics?.active_users || 0,
      icon: <Users className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className={`${card.color} border-none`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
              {card.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}