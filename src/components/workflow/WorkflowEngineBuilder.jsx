import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, X, Play, Calendar, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import AdvancedConditionBuilder from './AdvancedConditionBuilder';
import WebhookActionBuilder from './WebhookActionBuilder';

export default function WorkflowEngineBuilder({ workflow, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(workflow || {
    name: '',
    description: '',
    trigger_type: 'scheduled',
    trigger_config: { cron: '0 9 * * *' },
    conditions: [],
    actions: [],
    is_active: true,
    category: 'payment'
  });

  const [conditions, setConditions] = useState(workflow?.conditions || []);
  const [actions, setActions] = useState(workflow?.actions || []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...formData, conditions, actions };
      if (workflow?.id) {
        await base44.entities.WorkflowAutomation.update(workflow.id, data);
      } else {
        await base44.entities.WorkflowAutomation.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow gespeichert');
      onClose?.();
    }
  });

  const addCondition = () => {
    setConditions([...conditions, { entity: 'Tenant', field: '', operator: 'equals', value: '' }]);
  };

  const addAction = () => {
    setActions([...actions, { type: 'send_email', config: {} }]);
  };

  const actionTypes = [
    { value: 'send_email', label: 'E-Mail senden' },
    { value: 'create_task', label: 'Aufgabe erstellen' },
    { value: 'archive_document', label: 'Dokument archivieren' },
    { value: 'update_entity', label: 'Datensatz aktualisieren' },
    { value: 'send_notification', label: 'Benachrichtigung senden' },
    { value: 'webhook', label: 'Webhook aufrufen' },
    { value: 'slack_message', label: 'Slack Nachricht' }
  ];

  const entityFieldOptions = [
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'created_date', label: 'Erstellt am', type: 'date' },
    { name: 'updated_date', label: 'Aktualisiert am', type: 'date' },
    { name: 'amount', label: 'Betrag', type: 'number' },
    { name: 'due_date', label: 'Fällig am', type: 'date' },
    { name: 'priority', label: 'Priorität', type: 'list' },
    { name: 'category', label: 'Kategorie', type: 'list' },
    { name: 'deposit_paid', label: 'Kaution bezahlt', type: 'boolean' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Workflow konfigurieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-semibold">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Automatische Mahnung bei Zahlungsverzug"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-semibold">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Was macht dieser Workflow?"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Kategorie</label>
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
                  <SelectItem value="document">Dokumente</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                  <SelectItem value="communication">Kommunikation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Auslöser</label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Zeitgesteuert</SelectItem>
                  <SelectItem value="event">Ereignis</SelectItem>
                  <SelectItem value="manual">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === 'scheduled' && (
              <div className="col-span-2">
                <label className="text-sm font-semibold">Zeitplan (Cron)</label>
                <Input
                  value={formData.trigger_config?.cron || '0 9 * * *'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger_config: { ...formData.trigger_config, cron: e.target.value }
                  })}
                  placeholder="0 9 * * * (täglich um 9 Uhr)"
                />
                <p className="text-xs text-slate-600 mt-1">Format: Minute Stunde Tag Monat Wochentag</p>
              </div>
            )}

            <div className="col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-semibold">Workflow aktiv</span>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AdvancedConditionBuilder 
        conditions={conditions}
        onChange={setConditions}
        entityFields={entityFieldOptions}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aktionen</CardTitle>
            <Button onClick={addAction} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex gap-2">
                <Select
                  value={action.type}
                  onValueChange={(value) => {
                    const updated = [...actions];
                    updated[idx].type = value;
                    setActions(updated);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(at => (
                      <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {action.type === 'send_email' && (
                <>
                  <Input
                    placeholder="Empfänger-Feld (z.B. tenant.email)"
                    value={action.config?.recipient_field || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, recipient_field: e.target.value };
                      setActions(updated);
                    }}
                  />
                  <Input
                    placeholder="Betreff"
                    value={action.config?.subject || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, subject: e.target.value };
                      setActions(updated);
                    }}
                  />
                  <Textarea
                    placeholder="E-Mail-Text"
                    value={action.config?.body || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, body: e.target.value };
                      setActions(updated);
                    }}
                  />
                </>
              )}

              {action.type === 'create_task' && (
                <>
                  <Input
                    placeholder="Aufgabentitel"
                    value={action.config?.task_title || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, task_title: e.target.value };
                      setActions(updated);
                    }}
                  />
                  <Textarea
                    placeholder="Beschreibung"
                    value={action.config?.description || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, description: e.target.value };
                      setActions(updated);
                    }}
                  />
                </>
              )}

              {action.type === 'archive_document' && (
                <Input
                  placeholder="Archivierungsgrund"
                  value={action.config?.reason || ''}
                  onChange={(e) => {
                    const updated = [...actions];
                    updated[idx].config = { ...updated[idx].config, reason: e.target.value };
                    setActions(updated);
                  }}
                />
              )}

              {action.type === 'webhook' && (
                <WebhookActionBuilder
                  action={action}
                  onChange={(updated) => {
                    const newActions = [...actions];
                    newActions[idx] = updated;
                    setActions(newActions);
                  }}
                />
              )}

              {action.type === 'slack_message' && (
                <>
                  <Input
                    placeholder="Slack Channel (z.B. #general)"
                    value={action.config?.channel || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, channel: e.target.value };
                      setActions(updated);
                    }}
                  />
                  <Textarea
                    placeholder="Nachricht (verwenden Sie {{feldname}} für Platzhalter)"
                    value={action.config?.message || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      updated[idx].config = { ...updated[idx].config, message: e.target.value };
                      setActions(updated);
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1">
          Speichern
        </Button>
        <Button variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}