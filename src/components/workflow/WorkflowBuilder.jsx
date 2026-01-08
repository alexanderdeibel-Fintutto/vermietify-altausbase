import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowBuilder({ open, onOpenChange, workflow }) {
  const [formData, setFormData] = useState(workflow || {
    name: '',
    description: '',
    trigger_type: 'manual',
    trigger_config: {},
    steps: [],
    is_active: true
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (workflow?.id) {
        return base44.entities.Workflow.update(workflow.id, data);
      }
      return base44.entities.Workflow.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow gespeichert');
      onOpenChange(false);
    }
  });

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), { action_type: 'send_email', config: {} }]
    });
  };

  const removeStep = (index) => {
    const newSteps = [...formData.steps];
    newSteps.splice(index, 1);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Automatische Zahlungserinnerung"
            />
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Was macht dieser Workflow?"
            />
          </div>

          <div>
            <Label>Trigger</Label>
            <Select 
              value={formData.trigger_type} 
              onValueChange={(val) => setFormData({ ...formData, trigger_type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuell</SelectItem>
                <SelectItem value="schedule">Zeitgesteuert</SelectItem>
                <SelectItem value="entity_create">Entity erstellt</SelectItem>
                <SelectItem value="entity_update">Entity aktualisiert</SelectItem>
                <SelectItem value="email_received">Email empfangen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Workflow-Schritte</Label>
              <Button size="sm" variant="outline" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" />
                Schritt hinzufügen
              </Button>
            </div>

            <div className="space-y-3">
              {formData.steps?.map((step, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="font-medium">Schritt {index + 1}</div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Aktion</Label>
                      <Select
                        value={step.action_type}
                        onValueChange={(val) => updateStep(index, 'action_type', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="send_email">Email senden</SelectItem>
                          <SelectItem value="create_task">Task erstellen</SelectItem>
                          <SelectItem value="update_entity">Entity aktualisieren</SelectItem>
                          <SelectItem value="call_function">Function aufrufen</SelectItem>
                          <SelectItem value="wait">Warten</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Konfiguration (JSON)</Label>
                      <Textarea
                        value={JSON.stringify(step.config || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const config = JSON.parse(e.target.value);
                            updateStep(index, 'config', config);
                          } catch {}
                        }}
                        placeholder='{"to": "user@example.com", "subject": "Test"}'
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}