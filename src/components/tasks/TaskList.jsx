import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TaskList({ tasks = [], onToggle }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <VfCheckbox
                checked={task.status === 'completed'}
                onCheckedChange={() => onToggle(task)}
              />
              <div className="flex-1">
                <div className={cn(
                  "font-medium",
                  task.status === 'completed' && "line-through text-[var(--theme-text-muted)]"
                )}>
                  {task.title}
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-[var(--theme-text-muted)] mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}