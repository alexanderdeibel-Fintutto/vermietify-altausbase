import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AIMaintenanceAssistant from '@/components/maintenance/AIMaintenanceAssistant';
import { Sparkles, Wrench } from 'lucide-react';

export default function AIMaintenanceDashboard() {
  const [selectedTask, setSelectedTask] = React.useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Building.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: () => base44.entities.MaintenanceTask.filter({ status: { $in: ['open', 'in_progress'] } })
  });

  const companyId = buildings[0]?.company_id;
  const buildingId = buildings[0]?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          KI-Wartungsassistent
        </h1>
        <p className="text-slate-600 mt-1">
          Intelligente Unterstützung für Wartungsanfragen
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Wartungsanfrage auswählen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTask?.id} onValueChange={(id) => setSelectedTask(tasks.find(t => t.id === id))}>
              <SelectTrigger>
                <SelectValue placeholder="Anfrage wählen..." />
              </SelectTrigger>
              <SelectContent>
                {tasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTask && (
              <div className="mt-4 p-3 bg-slate-50 rounded">
                <p className="font-medium text-sm mb-1">{selectedTask.title}</p>
                <p className="text-xs text-slate-600">{selectedTask.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedTask && companyId && buildingId ? (
            <AIMaintenanceAssistant
              taskId={selectedTask.id}
              buildingId={buildingId}
              companyId={companyId}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">Wählen Sie eine Wartungsanfrage aus</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}