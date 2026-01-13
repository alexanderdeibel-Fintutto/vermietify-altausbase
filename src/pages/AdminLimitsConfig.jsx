import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLimitsConfig() {
  const [editingLimit, setEditingLimit] = useState(null);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [editingPlanLimit, setEditingPlanLimit] = useState(null);
  const [planLimitDialogOpen, setPlanLimitDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: limits = [] } = useQuery({
    queryKey: ['adminLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list()
  });

  const { data: planLimits = [] } = useQuery({
    queryKey: ['adminPlanLimits'],
    queryFn: () => base44.entities.PlanLimit.list()
  });

  const createLimitMutation = useMutation({
    mutationFn: (data) => base44.entities.UsageLimit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLimits'] });
      setLimitDialogOpen(false);
      setEditingLimit(null);
      toast.success('Limit erstellt');
    }
  });

  const updateLimitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UsageLimit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLimits'] });
      setLimitDialogOpen(false);
      setEditingLimit(null);
      toast.success('Limit aktualisiert');
    }
  });

  const deleteLimitMutation = useMutation({
    mutationFn: (id) => base44.entities.UsageLimit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLimits'] });
      toast.success('Limit gelöscht');
    }
  });

  const upsertPlanLimitMutation = useMutation({
    mutationFn: async ({ plan_id, limit_id, limit_value }) => {
      const existing = planLimits.find(pl => pl.plan_id === plan_id && pl.limit_id === limit_id);
      if (existing) {
        return base44.entities.PlanLimit.update(existing.id, { limit_value });
      } else {
        return base44.entities.PlanLimit.create({ plan_id, limit_id, limit_value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlanLimits'] });
      setPlanLimitDialogOpen(false);
      setEditingPlanLimit(null);
      toast.success('Plan-Limit gespeichert');
    }
  });

  const getPlanLimit = (planId, limitId) => {
    return planLimits.find(pl => pl.plan_id === planId && pl.limit_id === limitId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Limits-Konfiguration</h1>
          <p className="text-sm text-slate-600">Definiere Nutzungslimits und deren Werte pro Plan</p>
        </div>
        <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLimit(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Limit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLimit ? 'Limit bearbeiten' : 'Neues Limit'}</DialogTitle>
            </DialogHeader>
            <LimitForm 
              limit={editingLimit}
              onSave={(data) => {
                if (editingLimit) {
                  updateLimitMutation.mutate({ id: editingLimit.id, data });
                } else {
                  createLimitMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setLimitDialogOpen(false);
                setEditingLimit(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {limits.map(limit => (
        <Card key={limit.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{limit.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{limit.key}</Badge>
                  {limit.reset_period !== 'never' && (
                    <Badge variant="outline" className="text-xs">
                      Reset: {limit.reset_period}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">{limit.description}</p>
                <div className="text-xs text-slate-500">
                  Entity: <code className="bg-slate-100 px-1 rounded">{limit.entity_to_count}</code>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setEditingLimit(limit);
                    setLimitDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    if (confirm('Limit wirklich löschen?')) {
                      deleteLimitMutation.mutate(limit.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {plans.map(plan => {
                const planLimit = getPlanLimit(plan.id, limit.id);
                return (
                  <Button
                    key={plan.id}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start"
                    onClick={() => {
                      setEditingPlanLimit({ plan, limit, value: planLimit?.limit_value ?? 0 });
                      setPlanLimitDialogOpen(true);
                    }}
                  >
                    <span className="text-xs text-slate-600">{plan.name}</span>
                    <span className="text-lg font-medium mt-1">
                      {planLimit ? (planLimit.limit_value === -1 ? '∞' : planLimit.limit_value) : '-'}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={planLimitDialogOpen} onOpenChange={setPlanLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlanLimit?.limit?.name} → {editingPlanLimit?.plan?.name}
            </DialogTitle>
          </DialogHeader>
          {editingPlanLimit && (
            <PlanLimitForm 
              planLimit={editingPlanLimit}
              onSave={(value) => {
                upsertPlanLimitMutation.mutate({
                  plan_id: editingPlanLimit.plan.id,
                  limit_id: editingPlanLimit.limit.id,
                  limit_value: value
                });
              }}
              onCancel={() => {
                setPlanLimitDialogOpen(false);
                setEditingPlanLimit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LimitForm({ limit, onSave, onCancel }) {
  const [formData, setFormData] = useState(limit || {
    key: '',
    name: '',
    description: '',
    entity_to_count: 'Building',
    count_filter: '{}',
    reset_period: 'never',
    overage_allowed: true,
    overage_price_per_unit: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Key</Label>
          <Input 
            value={formData.key} 
            onChange={e => setFormData({...formData, key: e.target.value})}
            placeholder="objects"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Objekte"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Entity zum Zählen</Label>
        <Input 
          value={formData.entity_to_count} 
          onChange={e => setFormData({...formData, entity_to_count: e.target.value})}
          placeholder="Building"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Reset-Periode</Label>
        <Select value={formData.reset_period} onValueChange={v => setFormData({...formData, reset_period: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Nie (Absolut)</SelectItem>
            <SelectItem value="monthly">Monatlich</SelectItem>
            <SelectItem value="yearly">Jährlich</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Überschreitungs-Preis (Cent/Einheit)</Label>
        <Input 
          type="number"
          value={formData.overage_price_per_unit} 
          onChange={e => setFormData({...formData, overage_price_per_unit: Number(e.target.value)})}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={formData.overage_allowed} 
          onCheckedChange={v => setFormData({...formData, overage_allowed: v})}
        />
        <Label>Überschreitung erlaubt</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </form>
  );
}

function PlanLimitForm({ planLimit, onSave, onCancel }) {
  const [value, setValue] = useState(planLimit.value ?? 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Limit-Wert</Label>
        <Input 
          type="number"
          value={value} 
          onChange={e => setValue(Number(e.target.value))}
          placeholder="10"
        />
        <p className="text-xs text-slate-500">-1 für unbegrenzt</p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1">Speichern</Button>
      </div>
    </form>
  );
}