import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

const triggerTypes = [
  { value: 'document_created', label: 'Dokument erstellt' },
  { value: 'document_archived', label: 'Dokument archiviert' },
  { value: 'signature_requested', label: 'Signatur angefordert' },
  { value: 'signature_completed', label: 'Signatur abgeschlossen' }
];

const actionTypes = [
  { value: 'send_signature_request', label: 'Signaturanfrage senden' },
  { value: 'send_notification', label: 'Benachrichtigung senden' },
  { value: 'create_task', label: 'Aufgabe erstellen' },
  { value: 'archive_document', label: 'Dokument archivieren' }
];

export default function WorkflowBuilder({ isOpen, onClose, companyId, workflow }) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || 'document_created');
  const [conditions, setConditions] = useState(workflow?.conditions || {});
  const [actions, setActions] = useState(workflow?.actions || []);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name || actions.length === 0) {
        throw new Error('Name und mindestens eine Aktion erforderlich');
      }

      if (workflow?.id) {
        // Update
        await base44.asServiceRole.entities.DocumentWorkflow.update(workflow.id, {
          name,
          description,
          trigger_type: triggerType,
          conditions,
          actions
        });
      } else {
        // Create
        await base44.asServiceRole.entities.DocumentWorkflow.create({
          name,
          description,
          company_id: companyId,
          trigger_type: triggerType,
          conditions,
          actions,
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', companyId] });
      onClose();
    }
  });

  const addAction = () => {
    setActions([...actions, { action_type: 'send_notification', order: actions.length, parameters: {} }]);
  };

  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index, updates) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Workflow-Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Automatische Signaturanfrage für Verträge"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Beschreibung</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Beschreibung des Workflows"
              rows={2}
            />
          </div>

          {/* Trigger */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Trigger</label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bedingungen (optional)</label>
            <Input
              placeholder="Dokumenttyp (z.B. contract)"
              value={conditions.document_type || ''}
              onChange={(e) => setConditions({ ...conditions, document_type: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Aktionen</label>
              <Button size="sm" variant="outline" onClick={addAction} className="gap-1">
                <Plus className="w-4 h-4" />
                Hinzufügen
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="bg-slate-50 p-4 rounded-lg text-center text-sm text-slate-600">
                Klicken Sie "Hinzufügen", um eine Aktion zu erstellen
              </div>
            ) : (
              <div className="space-y-2">
                {actions.map((action, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Aktion {idx + 1}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAction(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Select
                        value={action.action_type}
                        onValueChange={(value) => updateAction(idx, { action_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map(a => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Action-specific parameters */}
                      {action.action_type === 'send_signature_request' && (
                        <div className="space-y-2">
                          <Input
                            placeholder="E-Mail Unterzeichner"
                            value={action.parameters.signers_email || ''}
                            onChange={(e) => updateAction(idx, {
                              parameters: { ...action.parameters, signers_email: e.target.value }
                            })}
                          />
                          <Textarea
                            placeholder="Nachricht (optional)"
                            value={action.parameters.message || ''}
                            onChange={(e) => updateAction(idx, {
                              parameters: { ...action.parameters, message: e.target.value }
                            })}
                            rows={2}
                          />
                        </div>
                      )}

                      {action.action_type === 'send_notification' && (
                        <Input
                          placeholder="Nachricht"
                          value={action.parameters.message || ''}
                          onChange={(e) => updateAction(idx, {
                            parameters: { ...action.parameters, message: e.target.value }
                          })}
                        />
                      )}

                      {action.action_type === 'create_task' && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Aufgabentitel"
                            value={action.parameters.title || ''}
                            onChange={(e) => updateAction(idx, {
                              parameters: { ...action.parameters, title: e.target.value }
                            })}
                          />
                          <Select
                            value={action.parameters.priority || 'medium'}
                            onValueChange={(value) => updateAction(idx, {
                              parameters: { ...action.parameters, priority: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Priorität" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Niedrig</SelectItem>
                              <SelectItem value="medium">Mittel</SelectItem>
                              <SelectItem value="high">Hoch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {workflow ? 'Aktualisieren' : 'Erstellen'}
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
  );
}