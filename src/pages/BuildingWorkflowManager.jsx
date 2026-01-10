import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Play, Pause, Trash2, Calendar, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const workflowActionTypes = [
  { value: 'rent_reminder', label: 'Mieterinnerung', category: 'payment' },
  { value: 'lease_renewal', label: 'Vertragsverlängerung', category: 'contract' },
  { value: 'maintenance_scheduling', label: 'Wartungsplanung', category: 'maintenance' },
  { value: 'vendor_management', label: 'Lieferanten-Management', category: 'maintenance' }
];

export default function BuildingWorkflowManager() {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'payment',
    trigger_type: 'scheduled',
    trigger_config: { frequency: 'daily' },
    actions: [{ type: 'rent_reminder', config: {} }],
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['building-workflows'],
    queryFn: () => base44.entities.WorkflowAutomation.filter({
      category: { $in: ['payment', 'contract', 'maintenance'] }
    })
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.WorkflowAutomation.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['building-workflows']);
      setCreating(false);
      setFormData({
        name: '',
        description: '',
        category: 'payment',
        trigger_type: 'scheduled',
        trigger_config: { frequency: 'daily' },
        actions: [{ type: 'rent_reminder', config: {} }],
        is_active: true
      });
      toast.success('Workflow erstellt');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.WorkflowAutomation.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['building-workflows']);
      toast.success('Workflow aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkflowAutomation.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['building-workflows']);
      toast.success('Workflow gelöscht');
    }
  });

  const updateActionConfig = (index, key, value) => {
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      config: { ...newActions[index].config, [key]: value }
    };
    setFormData({ ...formData, actions: newActions });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gebäude-Workflows</h1>
            <p className="text-slate-600">Automatisierte Verwaltungsaufgaben</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Workflow
        </Button>
      </div>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>Neuer Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Monatliche Mieterinnerung"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Kategorie</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Zahlungen</SelectItem>
                    <SelectItem value="contract">Verträge</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Was macht dieser Workflow?"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Ausführung</label>
              <Select
                value={formData.trigger_config.frequency}
                onValueChange={(value) => setFormData({
                  ...formData,
                  trigger_config: { frequency: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Aktion</label>
              <Select
                value={formData.actions[0].type}
                onValueChange={(value) => setFormData({
                  ...formData,
                  actions: [{ type: value, config: {} }]
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workflowActionTypes.map(action => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.actions[0].type === 'rent_reminder' && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Tage vor Fälligkeit</label>
                <Input
                  type="number"
                  value={formData.actions[0].config.days_before_due || 3}
                  onChange={(e) => updateActionConfig(0, 'days_before_due', parseInt(e.target.value))}
                />
              </div>
            )}

            {formData.actions[0].type === 'lease_renewal' && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Tage vor Ablauf</label>
                <Input
                  type="number"
                  value={formData.actions[0].config.days_before_expiry || 60}
                  onChange={(e) => updateActionConfig(0, 'days_before_expiry', parseInt(e.target.value))}
                />
              </div>
            )}

            {formData.actions[0].type === 'maintenance_scheduling' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Wartungstyp</label>
                  <Select
                    value={formData.actions[0].config.maintenance_type || 'inspection'}
                    onValueChange={(value) => updateActionConfig(0, 'maintenance_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspection">Inspektion</SelectItem>
                      <SelectItem value="maintenance">Wartung</SelectItem>
                      <SelectItem value="cleaning">Reinigung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Intervall (Monate)</label>
                  <Input
                    type="number"
                    value={formData.actions[0].config.interval_months || 6}
                    onChange={(e) => updateActionConfig(0, 'interval_months', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => createMutation.mutate()} disabled={!formData.name}>
                Erstellen
              </Button>
              <Button onClick={() => setCreating(false)} variant="outline">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {workflows.map(workflow => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{workflow.name}</CardTitle>
                  <Badge>{workflow.category}</Badge>
                  {workflow.is_active ? (
                    <Badge className="bg-green-500">Aktiv</Badge>
                  ) : (
                    <Badge className="bg-slate-500">Inaktiv</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleMutation.mutate({
                      id: workflow.id,
                      is_active: !workflow.is_active
                    })}
                  >
                    {workflow.is_active ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">{workflow.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {workflow.trigger_config?.frequency || 'N/A'}
                </div>
                {workflow.last_run && (
                  <div>
                    Zuletzt: {new Date(workflow.last_run).toLocaleString('de-DE')}
                  </div>
                )}
                <div>
                  Ausführungen: {workflow.run_count || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}