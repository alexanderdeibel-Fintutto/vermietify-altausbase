import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';

export default function DeadlineTrafficLight() {
  const deadlines = [
    { task: 'Einkommensteuererklärung', date: '2026-05-31', days: 141, priority: 'green' },
    { task: 'Grundsteuer Q1', date: '2026-02-15', days: 36, priority: 'yellow' },
    { task: 'USt-Voranmeldung Januar', date: '2026-02-10', days: 31, priority: 'yellow' },
    { task: 'Versicherung Gebäude A', date: '2026-01-25', days: 15, priority: 'red' }
  ];

  const getColor = (priority) => {
    if (priority === 'red') return 'bg-red-600';
    if (priority === 'yellow') return 'bg-orange-600';
    return 'bg-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Fristen-Ampel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {deadlines.map((deadline, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${getColor(deadline.priority)}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold">{deadline.task}</p>
              <p className="text-xs text-slate-600">{deadline.date}</p>
            </div>
            <Badge className={getColor(deadline.priority)}>
              {deadline.days}d
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}