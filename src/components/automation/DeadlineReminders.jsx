import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function DeadlineReminders() {
  const deadlines = [
    { 
      title: 'Anlage V Einreichung',
      date: '2026-05-31',
      daysLeft: 134,
      priority: 'high'
    },
    {
      title: 'BK-Abrechnung versenden',
      date: '2026-12-31',
      daysLeft: 348,
      priority: 'medium'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Fristen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline, index) => (
            <div key={index} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{deadline.title}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                    Fällig: {new Date(deadline.date).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <VfBadge variant={deadline.priority === 'high' ? 'error' : 'warning'}>
                  {deadline.daysLeft} Tage
                </VfBadge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}