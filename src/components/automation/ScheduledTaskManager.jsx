import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Clock, Play, Pause } from 'lucide-react';

export default function ScheduledTaskManager() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['scheduledTasks'],
    queryFn: async () => {
      const response = await fetch('/api/scheduled-tasks');
      return response.json();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Geplante Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{task.name}</p>
              <p className="text-xs text-slate-600">{task.schedule}</p>
            </div>
            <Badge className={task.is_active ? 'bg-green-600' : 'bg-gray-600'}>
              {task.is_active ? 'Aktiv' : 'Pausiert'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}