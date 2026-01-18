import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function TaskStats({ tasks = [] }) {
  const completed = tasks.filter(t => t.status === 'Erledigt').length;
  const inProgress = tasks.filter(t => t.status === 'In Bearbeitung').length;
  const overdue = tasks.filter(t => {
    if (t.status === 'Erledigt' || !t.faelligkeitsdatum) return false;
    return new Date(t.faelligkeitsdatum) < new Date();
  }).length;

  const stats = [
    { label: 'Erledigt', value: completed, icon: CheckCircle, color: 'text-[var(--vf-success-500)]' },
    { label: 'In Arbeit', value: inProgress, icon: Clock, color: 'text-[var(--vf-info-500)]' },
    { label: 'Überfällig', value: overdue, icon: AlertCircle, color: 'text-[var(--vf-error-500)]' }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}