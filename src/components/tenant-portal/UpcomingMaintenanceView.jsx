import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  pending: 'bg-slate-100 text-slate-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
};

const categoryLabels = {
  plumbing: 'Sanitär',
  electrical: 'Elektrik',
  heating: 'Heizung',
  cleaning: 'Reinigung',
  painting: 'Malerarbeiten',
  carpentry: 'Tischlerei',
  general: 'Allgemein'
};

export default function UpcomingMaintenanceView({ unitId }) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tenant-maintenance', unitId],
    queryFn: async () => {
      const allTasks = await base44.entities.MaintenanceTask.filter({ 
        unit_id: unitId,
        status: { $in: ['pending', 'assigned', 'in_progress'] }
      });
      return allTasks.sort((a, b) => 
        new Date(a.scheduled_date || a.created_date) - new Date(b.scheduled_date || b.created_date)
      );
    },
    enabled: !!unitId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="w-5 h-5" />
          Anstehende Wartungsarbeiten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-600 text-center py-4">Lädt...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-600">Keine anstehenden Wartungsarbeiten</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                    )}
                  </div>
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[task.category] || task.category}
                  </Badge>
                  
                  <Badge className={statusColors[task.status]}>
                    {task.status === 'pending' && 'Ausstehend'}
                    {task.status === 'assigned' && 'Zugewiesen'}
                    {task.status === 'in_progress' && 'In Bearbeitung'}
                  </Badge>

                  {task.scheduled_date && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.scheduled_date).toLocaleDateString('de-DE')}
                    </Badge>
                  )}
                </div>

                {task.assigned_to && (
                  <div className="mt-3 text-xs text-slate-600">
                    Zugewiesen an: {task.assigned_to}
                  </div>
                )}

                {task.notes && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-slate-700">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    {task.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}