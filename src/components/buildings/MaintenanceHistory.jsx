import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function MaintenanceHistory({ buildingId }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['building-maintenance-history', buildingId],
    queryFn: async () => {
      const allTasks = await base44.entities.BuildingTask.filter({ building_id: buildingId });
      return allTasks
        .filter(t => t.task_type === 'maintenance' && t.status === 'completed')
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 20);
    }
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="w-5 h-5" />
          Wartungshistorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="border-l-4 border-slate-300 pl-4 py-2">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm text-slate-900">{task.task_title}</h4>
                <Badge className={priorityColors[task.priority]} className="text-xs">
                  {task.priority}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{task.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {format(new Date(task.completed_at), 'dd. MMM yyyy', { locale: de })}
                </span>
                {task.actual_cost && (
                  <span className="text-xs font-medium text-slate-700">
                    €{task.actual_cost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">Keine Wartungsaufgaben abgeschlossen</p>
        )}
      </CardContent>
    </Card>
  );
}