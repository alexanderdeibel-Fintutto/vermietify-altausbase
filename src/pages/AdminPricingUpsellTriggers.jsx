import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';

export default function AdminPricingUpsellTriggers() {
  const queryClient = useQueryClient();
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: triggers = [] } = useQuery({
    queryKey: ['upsellTriggers'],
    queryFn: () => base44.entities.UpsellTrigger.list('-priority')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTrigger?.id) {
        return await base44.entities.UpsellTrigger.update(editingTrigger.id, data);
      } else {
        return await base44.entities.UpsellTrigger.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsellTriggers'] });
      setDialogOpen(false);
      setEditingTrigger(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.UpsellTrigger.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsellTriggers'] });
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Upsell-Trigger</h1>
          <p className="text-slate-600 mt-1">Automatische Upgrade-Vorschläge</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTrigger(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrigger ? 'Trigger bearbeiten' : 'Neuer Trigger'}</DialogTitle>
            </DialogHeader>
            <TriggerForm
              trigger={editingTrigger}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setEditingTrigger(null);
              }}
              isSaving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {triggers.map(trigger => (
          <Card key={trigger.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-light">{trigger.data.name}</h3>
                    <Badge variant="secondary" className="font-mono">
                      {trigger.data.trigger_code}
                    </Badge>
                    {trigger.data.is_active ? (
                      <Badge>Aktiv</Badge>
                    ) : (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-600 mt-2 text-sm">{trigger.data.description}</p>
                  
                  <div className="flex gap-6 mt-3 text-sm">
                    <div>
                      <span className="text-slate-500">Typ:</span>{' '}
                      <span>{trigger.data.trigger_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Ziel:</span>{' '}
                      <span>{trigger.data.target_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Anzeige:</span>{' '}
                      <span>{trigger.data.display_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Priorität:</span>{' '}
                      <span>{trigger.data.priority}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="font-medium mb-1">{trigger.data.message_title}</div>
                    <div className="text-slate-600">{trigger.data.message_body}</div>
                    <Button size="sm" className="mt-2" variant="outline">
                      {trigger.data.message_cta}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTrigger(trigger);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Trigger wirklich löschen?')) {
                        deleteMutation.mutate(trigger.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {triggers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Noch keine Trigger erstellt
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TriggerForm({ trigger, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(trigger?.data || {
    trigger_code: '',
    name: '',
    description: '',
    trigger_type: 'LIMIT_REACHED',
    trigger_condition: '{}',
    target_type: 'UPGRADE_TIER',
    target_ids: '[]',
    message_title: '',
    message_body: '',
    message_cta: 'Jetzt upgraden',
    display_type: 'BANNER',
    display_frequency: 'ONCE_PER_SESSION',
    is_active: false,
    priority: 0,
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input
            value={formData.trigger_code}
            onChange={(e) => setFormData({ ...formData, trigger_code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Trigger-Typ *</Label>
          <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIMIT_REACHED">Limit erreicht</SelectItem>
              <SelectItem value="FEATURE_BLOCKED">Feature blockiert</SelectItem>
              <SelectItem value="USAGE_PATTERN">Nutzungsmuster</SelectItem>
              <SelectItem value="TIME_BASED">Zeitbasiert</SelectItem>
              <SelectItem value="MANUAL">Manuell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ziel-Typ *</Label>
          <Select value={formData.target_type} onValueChange={(value) => setFormData({ ...formData, target_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPGRADE_TIER">Tier-Upgrade</SelectItem>
              <SelectItem value="ADD_ADDON">Add-On hinzufügen</SelectItem>
              <SelectItem value="ADD_BUNDLE">Bundle vorschlagen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Trigger-Bedingung (JSON)</Label>
        <Textarea
          value={formData.trigger_condition}
          onChange={(e) => setFormData({ ...formData, trigger_condition: e.target.value })}
          rows={3}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
        <Label className="text-base">Nachricht</Label>
        
        <div className="space-y-2">
          <Label>Titel *</Label>
          <Input
            value={formData.message_title}
            onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Text *</Label>
          <Textarea
            value={formData.message_body}
            onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
            rows={3}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Button-Text *</Label>
          <Input
            value={formData.message_cta}
            onChange={(e) => setFormData({ ...formData, message_cta: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Anzeige-Typ *</Label>
          <Select value={formData.display_type} onValueChange={(value) => setFormData({ ...formData, display_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MODAL">Modal/Dialog</SelectItem>
              <SelectItem value="BANNER">Banner</SelectItem>
              <SelectItem value="INLINE">Inline</SelectItem>
              <SelectItem value="TOAST">Toast-Nachricht</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Häufigkeit *</Label>
          <Select value={formData.display_frequency} onValueChange={(value) => setFormData({ ...formData, display_frequency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONCE">Nur einmal</SelectItem>
              <SelectItem value="ONCE_PER_SESSION">Einmal pro Session</SelectItem>
              <SelectItem value="ALWAYS">Immer</SelectItem>
              <SelectItem value="DAILY">Täglich max.</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorität</Label>
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sortierung</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Aktiv</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}

function TriggerForm({ trigger, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(trigger?.data || {
    trigger_code: '',
    name: '',
    description: '',
    trigger_type: 'LIMIT_REACHED',
    trigger_condition: '{}',
    target_type: 'UPGRADE_TIER',
    target_ids: '[]',
    message_title: '',
    message_body: '',
    message_cta: 'Jetzt upgraden',
    display_type: 'BANNER',
    display_frequency: 'ONCE_PER_SESSION',
    is_active: false,
    priority: 0,
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input
            value={formData.trigger_code}
            onChange={(e) => setFormData({ ...formData, trigger_code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Trigger-Typ *</Label>
          <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIMIT_REACHED">Limit erreicht</SelectItem>
              <SelectItem value="FEATURE_BLOCKED">Feature blockiert</SelectItem>
              <SelectItem value="USAGE_PATTERN">Nutzungsmuster</SelectItem>
              <SelectItem value="TIME_BASED">Zeitbasiert</SelectItem>
              <SelectItem value="MANUAL">Manuell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ziel-Typ *</Label>
          <Select value={formData.target_type} onValueChange={(value) => setFormData({ ...formData, target_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPGRADE_TIER">Tier-Upgrade</SelectItem>
              <SelectItem value="ADD_ADDON">Add-On hinzufügen</SelectItem>
              <SelectItem value="ADD_BUNDLE">Bundle vorschlagen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Trigger-Bedingung (JSON)</Label>
        <Textarea
          value={formData.trigger_condition}
          onChange={(e) => setFormData({ ...formData, trigger_condition: e.target.value })}
          rows={3}
          className="font-mono text-sm"
          placeholder='{"limit_key": "objects", "threshold_percent": 80}'
        />
      </div>

      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
        <Label className="text-base">Nachricht für User</Label>
        
        <div className="space-y-2">
          <Label>Titel *</Label>
          <Input
            value={formData.message_title}
            onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
            placeholder="Sie haben 80% Ihrer Objekte genutzt"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Text *</Label>
          <Textarea
            value={formData.message_body}
            onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
            rows={3}
            placeholder="Upgraden Sie auf Pro für unbegrenzte Objekte..."
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Button-Text *</Label>
          <Input
            value={formData.message_cta}
            onChange={(e) => setFormData({ ...formData, message_cta: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Anzeige-Typ *</Label>
          <Select value={formData.display_type} onValueChange={(value) => setFormData({ ...formData, display_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MODAL">Modal/Dialog</SelectItem>
              <SelectItem value="BANNER">Banner</SelectItem>
              <SelectItem value="INLINE">Inline</SelectItem>
              <SelectItem value="TOAST">Toast-Nachricht</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Häufigkeit *</Label>
          <Select value={formData.display_frequency} onValueChange={(value) => setFormData({ ...formData, display_frequency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONCE">Nur einmal</SelectItem>
              <SelectItem value="ONCE_PER_SESSION">Einmal pro Session</SelectItem>
              <SelectItem value="ALWAYS">Immer</SelectItem>
              <SelectItem value="DAILY">Täglich max.</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorität</Label>
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sortierung</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Aktiv</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}