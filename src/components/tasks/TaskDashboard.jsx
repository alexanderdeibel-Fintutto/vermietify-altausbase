import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TaskList from './TaskList';
import { CheckSquare } from 'lucide-react';
import { VfEmptyState } from '@/components/shared/VfEmptyState';

export default function TaskDashboard() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date')
  });

  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Meine Aufgaben
          {pendingTasks.length > 0 && (
            <span className="vf-badge vf-badge-primary">{pendingTasks.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingTasks.length === 0 ? (
          <VfEmptyState
            title="Keine offenen Aufgaben"
            description="Sie haben alle Aufgaben erledigt"
          />
        ) : (
          <TaskList tasks={pendingTasks.slice(0, 5)} />
        )}
      </CardContent>
    </Card>
  );
}