import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RecurringMaintenancePlanner({ buildingId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'monthly',
    priority: 'medium',
    estimatedCost: ''
  });
  const queryClient = useQueryClient();

  const { data: recurringTasks = [] } = useQuery({
    queryKey: ['recurring-maintenance', buildingId],
    queryFn: async () => {
      const allTasks = await base44.entities.BuildingTask.filter({ building_id: buildingId });
      return allTasks.filter(t => t.is_recurring && t.task_type === 'maintenance');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: data.title,
        description: data.description,
        task_type: 'maintenance',
        priority: data.priority,
        status: 'open',
        is_recurring: true,
        recurrence_pattern: data.frequency,
        estimated_cost: data.estimatedCost ? parseFloat(data.estimatedCost) : 0,
        due_date: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-maintenance'] });
      setFormData({ title: '', description: '', frequency: 'monthly', priority: 'medium', estimatedCost: '' });
      setDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => base44.entities.BuildingTask.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-maintenance'] });
    }
  });

  const frequencyLabels = {
    monthly: 'Monatlich',
    quarterly: 'Vierteljährlich',
    'semi-annual': 'Halbjährlich',
    annual: 'Jährlich'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-5 h-5" />
          Wiederkehrende Wartung
        </CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neu
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recurringTasks.map(task => (
          <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
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
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={priorityColors[task.priority]} className="text-xs">
                {task.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {frequencyLabels[task.recurrence_pattern]}
              </Badge>
              {task.estimated_cost > 0 && (
                <Badge variant="secondary" className="text-xs">
                  ~€{task.estimated_cost.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        ))}

        {recurringTasks.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">Keine wiederkehrenden Aufgaben definiert</p>
        )}

        {/* Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wiederkehrende Wartungsaufgabe hinzufügen</DialogTitle>
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
                className="w-full border border-slate-300 rounded-lg p-2 text-sm resize-none h-20"
              />
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  <SelectItem value="semi-annual">Halbjährlich</SelectItem>
                  <SelectItem value="annual">Jährlich</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Geschätzte Kosten (€)"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.title || createMutation.isPending}
                >
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