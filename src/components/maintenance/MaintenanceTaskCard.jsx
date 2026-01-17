import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { Wrench, MapPin, Calendar } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function MaintenanceTaskCard({ task, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--vf-warning-100)] flex items-center justify-center flex-shrink-0">
            <Wrench className="h-5 w-5 text-[var(--vf-warning-600)]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-1">{task.title}</div>
            <div className="text-sm text-[var(--theme-text-secondary)] mb-2">
              {task.description}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-[var(--theme-text-muted)]">
              {task.building_name && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {task.building_name}
                </div>
              )}
              {task.created_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <TimeAgo date={task.created_date} />
                </div>
              )}
            </div>
          </div>

          <StatusBadge status={task.status || 'open'} />
        </div>
      </CardContent>
    </Card>
  );
}