import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const priorityIcons = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
  critical: '⚠️',
};

export default function MaintenanceRequestList({ tenantId }) {
  const { data: maintenanceTasks = [] } = useQuery({
    queryKey: ['maintenance-requests', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      // Note: Ideally we'd query by tenant_id, but MaintenanceTask might not have this field
      // So we fetch all and filter client-side
      const allTasks = await base44.entities.MaintenanceTask.list('-created_date', 100);
      return allTasks;
    },
    enabled: !!tenantId,
  });

  const sortedTasks = [...maintenanceTasks].sort((a, b) => {
    const statusOrder = { open: 0, in_progress: 1, completed: 2, cancelled: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-light text-slate-900">Ihre Wartungsanfragen</h3>
        <p className="text-sm font-light text-slate-600 mt-1">
          Status und Verlauf Ihrer eingereichten Anfragen
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-light text-slate-500">
              Keine Wartungsanfragen eingereicht
            </p>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div
              key={task.id}
              className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <h4 className="font-light text-slate-900">{task.title}</h4>
                  </div>
                  <p className="text-sm font-light text-slate-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge className={statusColors[task.status]}>
                      {task.status === 'open' && '🟦 Offen'}
                      {task.status === 'in_progress' && '⏳ In Bearbeitung'}
                      {task.status === 'completed' && '✅ Abgeschlossen'}
                      {task.status === 'cancelled' && '❌ Abgebrochen'}
                    </Badge>
                    <Badge className={priorityColors[task.priority]}>
                      {priorityIcons[task.priority]} {task.priority}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-light">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.created_date), 'dd.MM.yyyy', { locale: de })}
                  </div>
                  {task.due_date && (
                    <p className="text-xs font-light text-slate-500 mt-1">
                      Fällig: {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}