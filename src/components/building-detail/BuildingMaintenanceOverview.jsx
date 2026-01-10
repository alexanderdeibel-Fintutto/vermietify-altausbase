import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Ausstehend', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  assigned: { label: 'Zugewiesen', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Bearbeitung', color: 'bg-purple-100 text-purple-800', icon: Wrench },
  completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Abgebrochen', color: 'bg-slate-100 text-slate-800', icon: AlertCircle }
};

export default function BuildingMaintenanceOverview({ buildingId }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['building-maintenance', buildingId],
    queryFn: () => base44.entities.MaintenanceTask.filter({ building_id: buildingId }, '-created_date')
  });

  const activeTasks = tasks.filter(t => ['pending', 'assigned', 'in_progress'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Wartungsaufgaben
          </span>
          <Badge variant="outline">{tasks.length} gesamt</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Keine Wartungsaufgaben</p>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pb-3 border-b">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{activeTasks.length}</p>
                <p className="text-xs text-slate-600">Aktiv</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                <p className="text-xs text-slate-600">Abgeschlossen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-600">{tasks.length}</p>
                <p className="text-xs text-slate-600">Gesamt</p>
              </div>
            </div>

            {/* Active Tasks */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Aktive Aufgaben</p>
              {activeTasks.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">Keine aktiven Aufgaben</p>
              ) : (
                activeTasks.slice(0, 5).map((task) => {
                  const config = STATUS_CONFIG[task.status];
                  const Icon = config.icon;
                  
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={config.color + ' text-xs'}>{config.label}</Badge>
                          <span className="text-xs text-slate-500 capitalize">{task.category}</span>
                          {task.scheduled_date && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">
                                {new Date(task.scheduled_date).toLocaleDateString('de-DE')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}