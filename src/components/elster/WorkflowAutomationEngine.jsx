import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Workflow, Play, Pause, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowAutomationEngine() {
  const [workflows, setWorkflows] = useState([
    {
      id: 'auto_generation',
      name: 'Auto-Generierung',
      description: 'Formulare automatisch bei neuen Finanz-Daten erstellen',
      enabled: true,
      trigger: 'monthly',
      last_run: new Date(Date.now() - 86400000),
      executions: 12
    },
    {
      id: 'validation_check',
      name: 'Validierungs-Check',
      description: 'Wöchentliche Prüfung aller Draft-Formulare',
      enabled: true,
      trigger: 'weekly',
      last_run: new Date(Date.now() - 172800000),
      executions: 48
    },
    {
      id: 'deadline_reminder',
      name: 'Fristen-Erinnerung',
      description: 'Email 7 Tage vor Abgabefrist',
      enabled: true,
      trigger: 'deadline-based',
      last_run: new Date(Date.now() - 604800000),
      executions: 5
    },
    {
      id: 'auto_submit',
      name: 'Auto-Übermittlung',
      description: 'Validierte Formulare automatisch einreichen',
      enabled: false,
      trigger: 'on-validation',
      last_run: null,
      executions: 0
    }
  ]);

  const toggleWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, enabled: !w.enabled } : w
    ));
    toast.success('Workflow aktualisiert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-purple-600" />
          Workflow Automation Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {workflows.map(workflow => (
            <div key={workflow.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium">{workflow.name}</div>
                    {workflow.enabled ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Play className="w-3 h-3 mr-1" />
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Pause className="w-3 h-3 mr-1" />
                        Pausiert
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    {workflow.description}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Trigger: {workflow.trigger}</span>
                    <span>•</span>
                    <span>Ausführungen: {workflow.executions}</span>
                    {workflow.last_run && (
                      <>
                        <span>•</span>
                        <span>Zuletzt: {new Date(workflow.last_run).toLocaleDateString('de-DE')}</span>
                      </>
                    )}
                  </div>
                </div>
                <Switch
                  checked={workflow.enabled}
                  onCheckedChange={() => toggleWorkflow(workflow.id)}
                />
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          Workflows konfigurieren
        </Button>
      </CardContent>
    </Card>
  );
}