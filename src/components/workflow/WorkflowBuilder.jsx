import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Play, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STEP_TYPES = [
  { id: 'send_notification', label: '📨 Benachrichtigung senden' },
  { id: 'update_field', label: '📝 Feld aktualisieren' },
  { id: 'create_task', label: '✓ Task erstellen' },
  { id: 'send_email', label: '✉️ Email senden' },
  { id: 'trigger_webhook', label: '🪝 Webhook auslösen' }
];

export default function WorkflowBuilder({ workflow = null, onSave = null }) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || 'event');
  const [steps, setSteps] = useState(workflow?.steps ? JSON.parse(workflow.steps) : []);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (workflow?.id) {
        await base44.entities.Workflow?.update?.(workflow.id, {
          name: name,
          description: description,
          trigger_type: triggerType,
          steps: JSON.stringify(steps)
        });
      } else {
        await base44.entities.Workflow?.create?.({
          name: name,
          description: description,
          trigger_type: triggerType,
          steps: JSON.stringify(steps)
        });
      }
    },
    onSuccess: () => {
      toast.success('✅ Workflow gespeichert');
      queryClient.invalidateQueries(['workflows']);
      if (onSave) onSave();
    }
  });

  const addStep = (stepType) => {
    setSteps([
      ...steps,
      {
        id: `step_${Date.now()}`,
        type: stepType,
        config: {}
      }
    ]);
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter(s => s.id !== stepId));
  };

  const updateStep = (stepId, updates) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Workflow Name</label>
          <Input
            placeholder="z.B. Invoice Automation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Beschreibung</label>
          <Input
            placeholder="Was tut dieser Workflow?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Trigger-Typ</label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event">🔔 Event-basiert</SelectItem>
              <SelectItem value="schedule">⏱️ Zeitgesteuert</SelectItem>
              <SelectItem value="manual">👆 Manuell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Workflow-Schritte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Schritte hinzugefügt</p>
          ) : (
            steps.map((step, idx) => (
              <div key={step.id} className="p-3 bg-slate-50 rounded border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {idx + 1}. {STEP_TYPES.find(s => s.id === step.type)?.label}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeStep(step.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Add Step */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-slate-600">Schritt hinzufügen</p>
            <div className="grid grid-cols-2 gap-2">
              {STEP_TYPES.map(stepType => (
                <Button
                  key={stepType.id}
                  size="sm"
                  variant="outline"
                  onClick={() => addStep(stepType.id)}
                  className="text-xs justify-start"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {stepType.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!name || steps.length === 0 || saveMutation.isPending}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Speichern
        </Button>
        {workflow?.id && (
          <Button variant="outline" className="gap-2">
            <Play className="w-4 h-4" />
            Test ausführen
          </Button>
        )}
      </div>
    </div>
  );
}