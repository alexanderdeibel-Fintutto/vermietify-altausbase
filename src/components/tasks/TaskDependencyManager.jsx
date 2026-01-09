import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GitBranch, AlertCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskDependencyManager({ taskId, buildingId }) {
  const [selectedDependency, setSelectedDependency] = useState('');
  const queryClient = useQueryClient();

  const { data: currentTask } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const tasks = await base44.entities.BuildingTask.filter({ id: taskId }, null, 1);
      return tasks[0];
    },
    enabled: !!taskId
  });

  const { data: availableTasks = [] } = useQuery({
    queryKey: ['availableTaskDeps', buildingId],
    queryFn: () => base44.entities.BuildingTask.filter({ 
      building_id: buildingId,
      status: { $ne: 'completed' }
    }, '-created_date', 100),
    enabled: !!buildingId
  });

  const addDependencyMutation = useMutation({
    mutationFn: async (dependencyId) => {
      const currentDeps = currentTask?.depends_on || [];
      return await base44.entities.BuildingTask.update(taskId, {
        depends_on: [...currentDeps, dependencyId],
        status: currentDeps.length === 0 ? 'blocked' : currentTask.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      toast.success('Abhängigkeit hinzugefügt');
      setSelectedDependency('');
    }
  });

  const removeDependencyMutation = useMutation({
    mutationFn: async (dependencyId) => {
      const updatedDeps = (currentTask?.depends_on || []).filter(id => id !== dependencyId);
      return await base44.entities.BuildingTask.update(taskId, {
        depends_on: updatedDeps,
        status: updatedDeps.length === 0 && currentTask.status === 'blocked' ? 'open' : currentTask.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      toast.success('Abhängigkeit entfernt');
    }
  });

  const dependencies = availableTasks.filter(t => 
    currentTask?.depends_on?.includes(t.id)
  );

  const availableForDependency = availableTasks.filter(t => 
    t.id !== taskId && !currentTask?.depends_on?.includes(t.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Aufgaben-Abhängigkeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Dependencies */}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Abhängig von:</p>
            {dependencies.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{dep.task_title}</p>
                  <Badge className={
                    dep.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {dep.status}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeDependencyMutation.mutate(dep.id)}
                  className="h-6 w-6"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Dependency */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Neue Abhängigkeit hinzufügen:</p>
          <div className="flex gap-2">
            <Select value={selectedDependency} onValueChange={setSelectedDependency}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Aufgabe auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableForDependency.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.task_title} ({task.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => addDependencyMutation.mutate(selectedDependency)}
              disabled={!selectedDependency || addDependencyMutation.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {currentTask?.status === 'blocked' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Aufgabe blockiert</p>
              <p className="text-xs text-red-700">
                Diese Aufgabe kann erst beginnen, wenn alle abhängigen Aufgaben abgeschlossen sind.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}