import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function DayPlanner({ buildingId }) {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['todayTasks', buildingId],
    queryFn: async () => {
      return await base44.entities.BuildingTask.filter(
        buildingId
          ? { building_id: buildingId, status: { $in: ['open', 'assigned', 'in_progress'] } }
          : { status: { $in: ['open', 'assigned', 'in_progress'] } },
        'priority',
        20
      );
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const scheduledTasks = todayTasks
    .map(task => ({
      ...task,
      building: buildings.find(b => b.id === task.building_id)
    }))
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Tagesplan
          <Badge>{scheduledTasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheduledTasks.map((task, idx) => (
            <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{task.task_title}</p>
                  {task.building && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {task.building.name}
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString('de-DE')}
                    </div>
                  )}
                </div>
                <Badge className={
                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {task.priority}
                </Badge>
              </div>
            </div>
          ))}
          {scheduledTasks.length === 0 && (
            <p className="text-center text-slate-600 py-8">Keine Aufgaben für heute</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}