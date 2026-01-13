import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Zap, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TRIGGERS = [
  { value: 'contract_ends', label: 'Mietvertrag endet in X Tagen', days: 30 },
  { value: 'invoice_overdue', label: 'Rechnung überfällig um X Tage', days: 7 },
  { value: 'unit_vacant', label: 'Einheit wird leer' },
  { value: 'contract_created', label: 'Neuer Mietvertrag erstellt' }
];

const ACTIONS = [
  { value: 'send_email', label: '📧 E-Mail senden', icon: <Mail className="w-4 h-4" /> },
  { value: 'send_slack', label: '💬 Slack-Nachricht', icon: <Zap className="w-4 h-4" /> },
  { value: 'create_task', label: '✓ Task erstellen', icon: <Plus className="w-4 h-4" /> }
];

export default function WorkflowBuilder({ open, onOpenChange }) {
  const [workflowName, setWorkflowName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');
  const [actionParams, setActionParams] = useState({});
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.WorkflowAutomation.create({
        name: workflowName,
        trigger: trigger,
        action: action,
        params: actionParams,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success('⚡ Workflow erstellt');
      handleReset();
      onOpenChange(false);
    },
    onError: () => toast.error('Fehler beim Erstellen')
  });

  const handleReset = () => {
    setWorkflowName('');
    setTrigger('');
    setAction('');
    setActionParams({});
  };

  const isValid = workflowName && trigger && action;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuer Automatisierungs-Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workflow Name */}
          <div>
            <label className="text-sm font-medium">Workflow-Name</label>
            <Input
              placeholder="z.B. 'Vertrag-Endet-Erinnerung'"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-sm font-medium">Trigger (Auslöser)</label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Wählen Sie einen Trigger" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGERS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trigger Parameters */}
          {trigger === 'contract_ends' && (
            <div>
              <label className="text-sm font-medium">Tage vor Ablauf</label>
              <Input
                type="number"
                defaultValue={30}
                onChange={(e) => setActionParams({...actionParams, days: parseInt(e.target.value)})}
                className="mt-1"
              />
            </div>
          )}

          {trigger === 'invoice_overdue' && (
            <div>
              <label className="text-sm font-medium">Tage Verspätung</label>
              <Input
                type="number"
                defaultValue={7}
                onChange={(e) => setActionParams({...actionParams, days: parseInt(e.target.value)})}
                className="mt-1"
              />
            </div>
          )}

          {/* Action */}
          <div>
            <label className="text-sm font-medium">Aktion</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {ACTIONS.map(a => (
                <Button
                  key={a.value}
                  variant={action === a.value ? 'default' : 'outline'}
                  onClick={() => setAction(a.value)}
                  className="gap-2 h-auto py-3"
                >
                  {a.icon}
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Action Parameters */}
          {action === 'send_email' && (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">E-Mail-Template</label>
                <Select value={actionParams.template || ''} onValueChange={(val) => setActionParams({...actionParams, template: val})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Template auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Erinnerung</SelectItem>
                    <SelectItem value="notification">Benachrichtigung</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Betreff"
                value={actionParams.subject || ''}
                onChange={(e) => setActionParams({...actionParams, subject: e.target.value})}
              />
            </div>
          )}

          {action === 'send_slack' && (
            <div>
              <label className="text-sm font-medium">Slack-Kanal</label>
              <Input
                placeholder="#general oder @username"
                value={actionParams.channel || ''}
                onChange={(e) => setActionParams({...actionParams, channel: e.target.value})}
                className="mt-1"
              />
            </div>
          )}

          {action === 'create_task' && (
            <div>
              <label className="text-sm font-medium">Task-Kategorie</label>
              <Select value={actionParams.category || ''} onValueChange={(val) => setActionParams({...actionParams, category: val})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Nachverfolgung</SelectItem>
                  <SelectItem value="review">Überprüfung</SelectItem>
                  <SelectItem value="action">Aktion erforderlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview */}
          {trigger && action && (
            <Card className="bg-slate-50">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-slate-700 mb-2">Workflow-Übersicht:</p>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>↳ <Badge variant="outline">{TRIGGERS.find(t => t.value === trigger)?.label}</Badge></p>
                  <p>→ <Badge variant="default">{ACTIONS.find(a => a.value === action)?.label}</Badge></p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}
            >
              {createMutation.isPending ? 'Erstelle...' : 'Workflow aktivieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}