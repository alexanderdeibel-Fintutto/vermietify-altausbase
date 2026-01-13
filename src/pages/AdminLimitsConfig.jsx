import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLimitsConfig() {
  const [editingLimit, setEditingLimit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list('-sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UsageLimit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usageLimits'] });
      setDialogOpen(false);
      setEditingLimit(null);
      toast.success('Limit erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UsageLimit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usageLimits'] });
      setDialogOpen(false);
      setEditingLimit(null);
      toast.success('Limit aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UsageLimit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usageLimits'] });
      toast.success('Limit gelöscht');
    }
  });

  const limitTypeColors = {
    HARD: 'bg-red-100 text-red-700',
    SOFT: 'bg-yellow-100 text-yellow-700',
    FEATURE_FLAG: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Nutzungs-Limits</h1>
          <p className="text-sm text-slate-600">Definiere globale Limits für alle Tarife</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLimit(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Limit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLimit ? 'Limit bearbeiten' : 'Neues Limit'}</DialogTitle>
            </DialogHeader>
            <LimitForm 
              limit={editingLimit}
              onSave={(data) => {
                if (editingLimit) {
                  updateMutation.mutate({ id: editingLimit.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingLimit(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {limits.map(limit => (
          <Card key={limit.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{limit.name}</CardTitle>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">{limit.limit_code}</code>
                    <Badge className={limitTypeColors[limit.limit_type]}>
                      {limit.limit_type}
                    </Badge>
                    {!limit.is_active && <Badge variant="outline">Inaktiv</Badge>}
                  </div>
                  {limit.description && (
                    <p className="text-sm text-slate-600">{limit.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setEditingLimit(limit);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm('Limit wirklich löschen?')) {
                        deleteMutation.mutate(limit.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {limit.entity_to_count && (
                  <div>
                    <span className="text-slate-600">Entity:</span>
                    <span className="ml-2 font-medium">{limit.entity_to_count}</span>
                  </div>
                )}
                {limit.unit && (
                  <div>
                    <span className="text-slate-600">Einheit:</span>
                    <span className="ml-2 font-medium">{limit.unit}</span>
                  </div>
                )}
                {limit.warning_threshold && (
                  <div>
                    <span className="text-slate-600">Warnung bei:</span>
                    <span className="ml-2 font-medium">{limit.warning_threshold}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LimitForm({ limit, onSave, onCancel }) {
  const [formData, setFormData] = useState(limit || {
    limit_code: '',
    name: '',
    description: '',
    limit_type: 'HARD',
    entity_to_count: '',
    count_filter: '{}',
    unit: '',
    warning_threshold: 80,
    is_active: true,
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input 
              value={formData.limit_code} 
              onChange={e => setFormData({...formData, limit_code: e.target.value.toUpperCase()})}
              placeholder="MAX_OBJECTS"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Max. Objekte"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Limit-Typ *</Label>
          <Select value={formData.limit_type} onValueChange={v => setFormData({...formData, limit_type: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HARD">HARD - Blockiert bei Überschreitung</SelectItem>
              <SelectItem value="SOFT">SOFT - Warnung bei Überschreitung</SelectItem>
              <SelectItem value="FEATURE_FLAG">FEATURE_FLAG - Boolean (ja/nein)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.limit_type !== 'FEATURE_FLAG' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity zum Zählen</Label>
                <Input 
                  value={formData.entity_to_count} 
                  onChange={e => setFormData({...formData, entity_to_count: e.target.value})}
                  placeholder="Building, Unit, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Einheit</Label>
                <Input 
                  value={formData.unit} 
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  placeholder="Objekte, Einheiten, MB"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warnungs-Schwelle (%)</Label>
              <Input 
                type="number"
                value={formData.warning_threshold} 
                onChange={e => setFormData({...formData, warning_threshold: Number(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input 
            type="number"
            value={formData.sort_order} 
            onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_active} 
            onCheckedChange={v => setFormData({...formData, is_active: v})}
          />
          <Label>Limit ist aktiv</Label>
        </div>
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