import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarView({ buildingId }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['upcomingTasks'],
    queryFn: () => base44.entities.BuildingTask.filter(
      { due_date: { $exists: true } },
      'due_date',
      20
    )
  });

  const groupedByDate = tasks.reduce((acc, task) => {
    const date = task.due_date?.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Kalender (Nächste Termine)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(groupedByDate).slice(0, 5).map(([date, dateTasks]) => (
          <div key={date} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
            <div className="space-y-1">
              {dateTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2">
                  <Badge className="text-xs">{task.task_type}</Badge>
                  <span className="text-xs flex-1">{task.task_title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}