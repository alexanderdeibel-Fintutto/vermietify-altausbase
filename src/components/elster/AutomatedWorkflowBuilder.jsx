import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workflow, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutomatedWorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [actions, setActions] = useState([]);
  const [creating, setCreating] = useState(false);

  const addAction = () => {
    setActions([...actions, { type: '', config: {}, name: '' }]);
  };

  const removeAction = (idx) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const createWorkflow = async () => {
    if (!workflowName || !triggerType || actions.length === 0) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    setCreating(true);
    try {
      const response = await base44.functions.invoke('createAutomatedWorkflow', {
        workflow_name: workflowName,
        trigger_type: triggerType,
        actions
      });

      if (response.data.success) {
        toast.success('Workflow erstellt');
        setWorkflowName('');
        setTriggerType('');
        setActions([]);
      }
    } catch (error) {
      toast.error('Workflow-Erstellung fehlgeschlagen');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Automatisierter Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Workflow-Name</Label>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="z.B. Auto-Backup nach Submission"
          />
        </div>

        <div>
          <Label>Trigger</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue placeholder="Wann soll der Workflow starten?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submission_created">Nach Erstellung</SelectItem>
              <SelectItem value="submission_validated">Nach Validierung</SelectItem>
              <SelectItem value="submission_accepted">Nach Akzeptierung</SelectItem>
              <SelectItem value="scheduled">Zeitgesteuert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Aktionen</Label>
            <Button onClick={addAction} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Aktion
            </Button>
          </div>

          {actions.map((action, idx) => (
            <div key={idx} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aktion {idx + 1}</span>
                <Button
                  onClick={() => removeAction(idx)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Select
                value={action.type}
                onValueChange={(value) => {
                  const updated = [...actions];
                  updated[idx].type = value;
                  setActions(updated);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aktion wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backup">Backup erstellen</SelectItem>
                  <SelectItem value="send_email">E-Mail senden</SelectItem>
                  <SelectItem value="generate_pdf">PDF generieren</SelectItem>
                  <SelectItem value="archive">Archivieren</SelectItem>
                  <SelectItem value="notify">Benachrichtigung</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Aktionsname"
                value={action.name}
                onChange={(e) => {
                  const updated = [...actions];
                  updated[idx].name = e.target.value;
                  setActions(updated);
                }}
              />
            </div>
          ))}
        </div>

        <Button
          onClick={createWorkflow}
          disabled={creating}
          className="w-full"
        >
          {creating ? 'Erstelle...' : 'Workflow erstellen'}
        </Button>
      </CardContent>
    </Card>
  );
}