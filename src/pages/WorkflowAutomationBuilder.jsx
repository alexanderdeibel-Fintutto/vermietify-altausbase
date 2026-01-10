import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import { Zap, Save, Play } from 'lucide-react';

export default function WorkflowAutomationBuilder() {
  const [activeTab, setActiveTab] = useState('builder');
  const [workflowId, setWorkflowId] = useState(null);
  const [workflow, setWorkflow] = useState({
    name: 'Neuer Workflow',
    description: '',
    trigger: {
      type: 'manual',
      conditions: []
    },
    steps: [],
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowAutomation.list('-created_date', 50);
      return result;
    }
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (workflowId) {
        return await base44.asServiceRole.entities.WorkflowAutomation.update(workflowId, workflow);
      } else {
        return await base44.asServiceRole.entities.WorkflowAutomation.create({
          ...workflow,
          company_id: user?.id,
          created_by: user?.email
        });
      }
    },
    onSuccess: (result) => {
      if (!workflowId) {
        setWorkflowId(result.id);
      }
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    }
  });

  const handleSave = () => {
    if (!workflow.name.trim()) {
      alert('Bitte geben Sie einen Workflow-Namen ein');
      return;
    }
    if (!workflow.steps || workflow.steps.length === 0) {
      alert('Bitte fügen Sie mindestens einen Schritt hinzu');
      return;
    }
    saveWorkflowMutation.mutate();
  };

  const loadWorkflow = (id) => {
    const selected = workflows.find(w => w.id === id);
    if (selected) {
      setWorkflow(selected);
      setWorkflowId(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Workflow-Automatisierung</h1>
            <p className="text-slate-600 text-sm">Erstellen Sie komplexe Automatisierungsabläufe mit Genehmigungen</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="library">Meine Workflows</TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <Input
                  value={workflow.name}
                  onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                  placeholder="z.B. Dokumentengenehmigung"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Beschreibung</label>
                <Textarea
                  value={workflow.description}
                  onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                  placeholder="Beschreiben Sie den Workflow..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Trigger</label>
                <select
                  value={workflow.trigger?.type || 'manual'}
                  onChange={(e) =>
                    setWorkflow({
                      ...workflow,
                      trigger: { ...workflow.trigger, type: e.target.value }
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                >
                  <option value="manual">Manuell ausgelöst</option>
                  <option value="document_created">Dokument erstellt</option>
                  <option value="task_assigned">Aufgabe zugewiesen</option>
                  <option value="scheduled">Zeitgesteuert</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Canvas */}
          <WorkflowCanvas workflow={workflow} onChange={setWorkflow} />

          {/* Save Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saveWorkflowMutation.isPending}
              className="gap-2 flex-1"
            >
              <Save className="w-4 h-4" />
              {saveWorkflowMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
            {workflowId && (
              <Button variant="outline" className="gap-2">
                <Play className="w-4 h-4" />
                Testen
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4">
          {workflows.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="pt-6 text-center text-slate-500">
                <p>Keine Workflows erstellt. Erstellen Sie einen neuen Workflow im Builder.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map(w => (
                <Card
                  key={w.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => loadWorkflow(w.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{w.name}</CardTitle>
                        <p className="text-xs text-slate-600 mt-1">{w.description}</p>
                      </div>
                      {w.is_active && (
                        <Badge className="bg-green-100 text-green-700">Aktiv</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{w.steps?.length || 0} Schritte</span>
                      <span>{w.execution_count || 0}x ausgeführt</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}