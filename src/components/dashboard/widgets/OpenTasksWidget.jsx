import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OpenTasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['open-tasks'],
    queryFn: async () => {
      const allTasks = await base44.entities.BuildingTask.list('-created_date', 100);
      return allTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    }
  });

  const { data: documentAnalyses = [] } = useQuery({
    queryKey: ['pending-analyses'],
    queryFn: async () => {
      const analyses = await base44.entities.DocumentAnalysis.list('-created_date', 50);
      return analyses.filter(a => a.status === 'pending');
    }
  });

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const totalPending = tasks.length + documentAnalyses.length;

  const recentTasks = tasks.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Offene Aufgaben</CardTitle>
          <Badge variant={urgentTasks.length > 0 ? 'destructive' : 'secondary'}>
            {totalPending}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-xs text-orange-600">Dringend</p>
              <p className="text-lg font-bold text-orange-900">{urgentTasks.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600">Zu prüfen</p>
              <p className="text-lg font-bold text-blue-900">{documentAnalyses.length}</p>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <div className="space-y-2 pt-3 border-t">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <CheckSquare className={`w-4 h-4 mt-0.5 ${
                  task.priority === 'urgent' ? 'text-red-600' :
                  task.priority === 'high' ? 'text-orange-600' :
                  'text-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.task_title}</p>
                  <p className="text-xs text-slate-500">
                    {task.building_id ? 'Gebäude' : 'Allgemein'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPending === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine offenen Aufgaben
          </p>
        )}

        {totalPending > 0 && (
          <Link to={createPageUrl('SmartTaskDashboard')}>
            <p className="text-sm text-blue-600 hover:underline text-center pt-2">
              Alle anzeigen →
            </p>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}