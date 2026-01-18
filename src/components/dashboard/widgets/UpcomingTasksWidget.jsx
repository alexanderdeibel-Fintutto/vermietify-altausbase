import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpcomingTasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list('-faelligkeitsdatum');
      return allTasks.filter(t => t.faelligkeitsdatum && t.status !== 'Erledigt').slice(0, 5);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Anstehende Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-2 hover:bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{task.titel}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">
                  {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={createPageUrl('Tasks')} className="w-full">
          <Button variant="outline" className="w-full">Alle Aufgaben</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}