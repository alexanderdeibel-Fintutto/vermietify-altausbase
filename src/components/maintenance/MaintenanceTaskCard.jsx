import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { VfBadge } from '@/components/shared/VfBadge';
import StatusBadge from '@/components/shared/StatusBadge';
import TimeAgo from '@/components/shared/TimeAgo';
import { Wrench, Calendar } from 'lucide-react';

export default function MaintenanceTaskCard({ task }) {
  const priorityVariant = {
    'Niedrig': 'default',
    'Mittel': 'warning',
    'Hoch': 'error',
    'Dringend': 'error'
  }[task.prioritaet] || 'default';

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[var(--theme-primary-light)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="h-5 w-5 text-[var(--theme-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold mb-1 truncate">{task.titel}</h4>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-2 line-clamp-2">
              {task.beschreibung}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <VfBadge variant={priorityVariant}>{task.prioritaet}</VfBadge>
              {task.faelligkeitsdatum && (
                <div className="flex items-center gap-1 text-xs text-[var(--theme-text-muted)]">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}