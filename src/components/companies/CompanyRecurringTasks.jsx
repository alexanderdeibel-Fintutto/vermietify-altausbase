import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CompanyRecurringTasks({ companyId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'monthly',
    dueDay: 15
  });
  const queryClient = useQueryClient();

  const { data: recurringTasks = [] } = useQuery({
    queryKey: ['company-recurring-tasks', companyId],
    queryFn: async () => {
      const allTasks = await base44.entities.BuildingTask.filter();
      return allTasks.filter(t => t.company_id === companyId && t.is_recurring);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.BuildingTask.create({
        company_id: companyId,
        task_title: data.title,
        description: data.description,
        task_type: 'administrative',
        status: 'open',
        is_recurring: true,
        recurrence_pattern: data.frequency,
        priority: 'medium'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-recurring-tasks'] });
      setFormData({ title: '', description: '', frequency: 'monthly', dueDay: 15 });
      setDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => base44.entities.BuildingTask.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-recurring-tasks'] });
    }
  });

  const frequencyLabels = {
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    quarterly: 'Vierteljährlich',
    annual: 'Jährlich'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="w-5 h-5" />
          Wiederkehrende Aufgaben
        </CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neu
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recurringTasks.map(task => (
          <div key={task.id} className="p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-slate-900">{task.task_title}</h4>
                <p className="text-xs text-slate-600 mt-1">{task.description}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                onClick={() => deleteMutation.mutate(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              {frequencyLabels[task.recurrence_pattern]}
            </Badge>
          </div>
        ))}

        {recurringTasks.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">Keine wiederkehrenden Aufgaben</p>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wiederkehrende Aufgabe hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Titel"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                placeholder="Beschreibung"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm h-20 resize-none"
              />
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  <SelectItem value="annual">Jährlich</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.title}>
                  Erstellen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}