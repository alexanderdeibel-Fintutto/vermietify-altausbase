import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Lock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function UpcomingTasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: async () => {
      const all = await base44.entities.BuildingTask.list();
      const upcoming = all.filter(t => 
        t.due_date && 
        new Date(t.due_date) > new Date() &&
        t.status !== 'completed'
      );
      return upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="w-5 h-5" />
          Anstehende Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className={`p-3 border rounded-lg ${task.status === 'blocked' ? 'bg-red-50 border-red-200' : 'hover:bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {task.task_title}
                  {task.status === 'blocked' && <Lock className="w-4 h-4 text-red-600" />}
                </p>
                {task.priority === 'urgent' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-600">{format(new Date(task.due_date), 'dd.MM.yyyy')}</p>
                {task.status === 'blocked' && (
                  <Badge className="bg-red-100 text-red-700 text-xs">Blockiert</Badge>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Keine anstehenden Aufgaben</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}