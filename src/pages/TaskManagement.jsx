import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import TaskList from '@/components/tasks/TaskList';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare } from 'lucide-react';
import { VfEmptyState } from '@/components/shared/VfEmptyState';

export default function TaskManagement() {
  const [filter, setFilter] = useState('pending');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list('-created_date');
      if (filter === 'all') return allTasks;
      return allTasks.filter(t => 
        filter === 'pending' ? t.status !== 'completed' : t.status === 'completed'
      );
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (task) => base44.entities.Task.update(task.id, {
      status: task.status === 'completed' ? 'pending' : 'completed'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Aufgaben"
        subtitle="Verwalten Sie Ihre To-Dos"
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        }
      />

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Offen ({tasks.filter(t => t.status !== 'completed').length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Erledigt
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Alle
        </Button>
      </div>

      {tasks.length === 0 ? (
        <VfEmptyState
          icon={CheckSquare}
          title="Keine Aufgaben"
          description={filter === 'pending' ? 'Sie haben alle Aufgaben erledigt' : 'Keine Aufgaben gefunden'}
        />
      ) : (
        <TaskList tasks={tasks} onToggle={(task) => toggleMutation.mutate(task)} />
      )}
    </div>
  );
}