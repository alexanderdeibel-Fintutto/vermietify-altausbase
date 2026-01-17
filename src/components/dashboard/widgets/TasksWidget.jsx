import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatusBadge from '@/components/shared/StatusBadge';

export default function TasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-widget'],
    queryFn: () => base44.entities.Task.filter({ status: 'Offen' }, '-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Offene Aufgaben
          <span className="vf-badge vf-badge-warning">{tasks.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{task.titel}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                    {task.kategorie || 'Allgemein'}
                  </div>
                </div>
                <StatusBadge status={task.prioritaet || 'Mittel'} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={createPageUrl('Tasks')} className="w-full">
          <Button variant="outline" className="w-full">
            Alle ansehen
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}