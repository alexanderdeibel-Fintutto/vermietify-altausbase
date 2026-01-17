import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function UpcomingDeadlinesWidget() {
  const { data: deadlines = [] } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.list();
      const tasks = await base44.entities.Task.list();
      
      const contractDeadlines = contracts
        .filter(c => c.end_date)
        .map(c => ({
          type: 'contract_end',
          title: `Vertrag endet`,
          date: c.end_date,
          related: c
        }));

      const taskDeadlines = tasks
        .filter(t => t.due_date && t.status !== 'completed')
        .map(t => ({
          type: 'task',
          title: t.title,
          date: t.due_date,
          related: t
        }));

      return [...contractDeadlines, ...taskDeadlines]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    }
  });

  const isUrgent = (date) => {
    const now = new Date();
    const deadline = new Date(date);
    const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);
    return daysUntil <= 7;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Anstehende Termine
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <p className="text-sm text-[var(--theme-text-muted)] text-center py-4">
            Keine anstehenden Termine
          </p>
        ) : (
          <div className="space-y-2">
            {deadlines.map((deadline, index) => (
              <div 
                key={index}
                className="flex items-start justify-between p-3 bg-[var(--theme-surface)] rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{deadline.title}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                    {new Date(deadline.date).toLocaleDateString('de-DE')}
                  </div>
                </div>
                {isUrgent(deadline.date) && (
                  <VfBadge variant="error" dot>
                    Dringend
                  </VfBadge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}