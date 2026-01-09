import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { List, Plus, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function SubtaskManager({ taskId, buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const queryClient = useQueryClient();

  const { data: subtasks = [] } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => base44.entities.BuildingTask.filter({ 
      parent_task_id: taskId 
    }, '-created_date', 50),
    enabled: !!taskId
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        parent_task_id: taskId,
        is_subtask: true,
        task_title: subtaskTitle,
        task_type: 'other',
        priority: 'medium',
        status: 'open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      toast.success('Unteraufgabe erstellt');
      setSubtaskTitle('');
      setShowForm(false);
    }
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      const newStatus = currentStatus === 'completed' ? 'open' : 'completed';
      return await base44.entities.BuildingTask.update(id, {
        status: newStatus,
        ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    }
  });

  const completedCount = subtasks.filter(s => s.status === 'completed').length;
  const progressPercentage = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <List className="w-4 h-4" />
            Unteraufgaben ({completedCount}/{subtasks.length})
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3 mr-1" />
            Hinzufügen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {subtasks.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-2">
              <span>Fortschritt</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="flex gap-2 p-3 bg-blue-50 rounded border border-blue-200">
            <Input
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Unteraufgabe..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && subtaskTitle.trim()) {
                  createSubtaskMutation.mutate();
                }
              }}
            />
            <Button 
              size="sm"
              onClick={() => createSubtaskMutation.mutate()}
              disabled={!subtaskTitle.trim() || createSubtaskMutation.isPending}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Subtasks List */}
        <div className="space-y-2">
          {subtasks.map(subtask => (
            <div
              key={subtask.id}
              className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
              onClick={() => toggleSubtaskMutation.mutate({ 
                id: subtask.id, 
                currentStatus: subtask.status 
              })}
            >
              {subtask.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              )}
              <span className={`text-sm flex-1 ${
                subtask.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
              }`}>
                {subtask.task_title}
              </span>
            </div>
          ))}
        </div>

        {subtasks.length === 0 && !showForm && (
          <p className="text-sm text-slate-600 text-center py-4">
            Keine Unteraufgaben
          </p>
        )}
      </CardContent>
    </Card>
  );
}