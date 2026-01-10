import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function AssignedTasksWidget() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['assigned-tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const result = await base44.asServiceRole.entities.DocumentTask.filter({
        assigned_to: user.email,
        status: 'open'
      });

      return result.sort((a, b) => {
        // Priority order: urgent > high > medium > low
        const priorityMap = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityMap[a.priority] || 3) - (priorityMap[b.priority] || 3);
      });
    },
    enabled: !!user?.email
  });

  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date() && task.status !== 'completed';
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600" />
          Meine Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">Keine offenen Aufgaben</p>
        ) : (
          <div className="space-y-3">
            {overdueTasks.length > 0 && (
              <div className="p-2 bg-red-50 rounded border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">
                  {overdueTasks.length} überfällig
                </p>
              </div>
            )}

            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-900 flex-1 line-clamp-1">{task.title}</p>
                  <Badge className={getPriorityColor(task.priority)} variant="secondary" className="text-xs flex-shrink-0">
                    {task.priority}
                  </Badge>
                </div>
                {task.due_date && (
                  <p className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                    Fällig: {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                )}
              </div>
            ))}

            {tasks.length > 5 && (
              <p className="text-xs text-slate-600 text-center pt-2">
                +{tasks.length - 5} weitere
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}