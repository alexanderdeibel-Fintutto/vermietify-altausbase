import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function TaskDependencyManager({ task, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: buildingTasks = [] } = useQuery({
    queryKey: ['building-tasks', task?.building_id],
    queryFn: async () => {
      if (!task?.building_id) return [];
      return await base44.entities.BuildingTask.filter({ 
        building_id: task.building_id 
      });
    },
    enabled: !!task?.building_id
  });

  const addDependencyMutation = useMutation({
    mutationFn: (dependsOnId) =>
      base44.functions.invoke('setTaskDependency', {
        task_id: task.id,
        depends_on_id: dependsOnId,
        remove: false
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-tasks'] });
    }
  });

  const removeDependencyMutation = useMutation({
    mutationFn: (dependsOnId) =>
      base44.functions.invoke('setTaskDependency', {
        task_id: task.id,
        depends_on_id: dependsOnId,
        remove: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-tasks'] });
    }
  });

  const availableTasks = buildingTasks.filter(
    t => t.id !== task?.id && 
         !task?.depends_on?.includes(t.id) &&
         (t.task_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.status.includes(searchQuery))
  );

  const getDependencyTasks = () => {
    if (!task?.depends_on) return [];
    return buildingTasks.filter(t => task.depends_on.includes(t.id));
  };

  const getBlockedByTasks = () => {
    if (!task?.blocked_by) return [];
    return buildingTasks.filter(t => task.blocked_by.includes(t.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Task-Abhängigkeiten verwalten</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Info */}
          {task?.status === 'blocked' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900">Diese Task ist blockiert</p>
                <p className="text-sm text-orange-700 mt-1">
                  Bitte schließen Sie die abhängigen Tasks ab, bevor Sie diese starten
                </p>
              </div>
            </div>
          )}

          {/* Dependencies (what this task depends on) */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Link className="w-5 h-5" />
              Abhängige Tasks (müssen zuerst erledigt werden)
            </h3>

            {getDependencyTasks().length > 0 ? (
              <div className="space-y-2 mb-4">
                {getDependencyTasks().map(depTask => (
                  <div
                    key={depTask.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{depTask.task_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={
                            depTask.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : depTask.status === 'blocked'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {depTask.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDependencyMutation.mutate(depTask.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm mb-4">Keine Abhängigkeiten</p>
            )}

            {/* Add Dependencies */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Task hinzufügen
                </label>
                <Input
                  placeholder="Nach Task suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {availableTasks.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableTasks.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{t.task_title}</p>
                        <p className="text-xs text-slate-500">{t.status}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addDependencyMutation.mutate(t.id)}
                        disabled={addDependencyMutation.isPending}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Keine weiteren Tasks verfügbar</p>
              )}
            </div>
          </div>

          {/* Blocked By (what is waiting for this task) */}
          {getBlockedByTasks().length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-slate-900 mb-3">
                Blockiert folgende Tasks
              </h3>
              <div className="space-y-2">
                {getBlockedByTasks().map(blockedTask => (
                  <Card key={blockedTask.id}>
                    <CardContent className="pt-4">
                      <p className="font-medium text-slate-900">{blockedTask.task_title}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Wird freigegeben, wenn diese Task erledigt ist
                      </p>
                      <Badge className="mt-2 bg-orange-100 text-orange-700">
                        Blockiert
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}