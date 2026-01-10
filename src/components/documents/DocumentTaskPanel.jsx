import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2, CheckSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

const taskTypeLabels = {
  review: 'Überprüfung',
  approval: 'Genehmigung',
  signature: 'Signatur',
  feedback: 'Rückmeldung',
  action: 'Aktion',
  other: 'Sonstiges'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function DocumentTaskPanel({ documentId, companyId }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'review',
    assigned_to: '',
    priority: 'medium',
    due_date: ''
  });
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['document-tasks', documentId],
    queryFn: async () => {
      const all = await base44.entities.DocumentTask.filter({ document_id: documentId });
      return all.sort((a, b) => {
        if (a.status !== b.status) {
          const statusOrder = { open: 0, in_progress: 1, completed: 2, cancelled: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(b.created_date) - new Date(a.created_date);
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createDocumentTask', {
        document_id: documentId,
        company_id: companyId,
        ...formData
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-tasks', documentId] });
      setCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        task_type: 'review',
        assigned_to: '',
        priority: 'medium',
        due_date: ''
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ task_id, status }) =>
      base44.functions.invoke('updateDocumentTask', {
        task_id,
        updates: { status }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-tasks', documentId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) =>
      base44.asServiceRole.entities.DocumentTask.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-tasks', documentId] });
    }
  });

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && dueDate;
  };

  const getTaskIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === 'in_progress') return <AlertCircle className="w-5 h-5 text-blue-600" />;
    return <Circle className="w-5 h-5 text-slate-400" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Aufgaben</CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Neue Aufgabe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titel</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Vertragsüberprüfung"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Beschreibung</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Typ</label>
                  <Select
                    value={formData.task_type}
                    onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(taskTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorität</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Zugewiesen an</label>
                <Input
                  type="email"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fälligkeitsdatum</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !formData.title || !formData.assigned_to}
                >
                  Erstellen
                </Button>
              </div>

              {createMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-900">{createMutation.error.message}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Keine Aufgaben</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getTaskIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                      <div className="flex gap-1 flex-shrink-0">
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateMutation.mutate({ task_id: task.id, status: 'completed' })}
                            disabled={updateMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(task.id)}
                          disabled={deleteMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {taskTypeLabels[task.task_type]} • {task.assigned_to}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                          {isOverdue(task.due_date) && '⚠️ '}
                          {format(new Date(task.due_date), 'dd. MMM', { locale: de })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}