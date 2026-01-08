import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from 'lucide-react';

export default function TasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 5)
  });

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-50">
          <CheckCircle2 className={`w-4 h-4 ${task.status === 'completed' ? 'text-green-600' : 'text-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{task.title}</div>
          </div>
          <Badge variant="outline" className="text-xs">{task.priority || 'normal'}</Badge>
        </div>
      ))}
    </div>
  );
}