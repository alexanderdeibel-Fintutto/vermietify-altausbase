import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, ArrowRight, CheckCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function OnboardingWorkflowBuilder() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['onboardingWorkflows'],
    queryFn: () => base44.entities.OnboardingWorkflow.list('-created_at', 50)
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin');
    }
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingWorkflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingWorkflows'] });
      toast.success('Workflow erstellt');
    }
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingWorkflow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingWorkflows'] });
      toast.success('Workflow gespeichert');
    }
  });

  const handleCreateWorkflow = () => {
    const newWorkflow = {
      workflow_name: 'Neuer Workflow',
      description: '',
      is_active: true,
      is_default: false,
      steps: [],
      created_at: new Date().toISOString()
    };
    createWorkflowMutation.mutate(newWorkflow);
  };

  const handleAddStep = (step) => {
    const steps = [...(selectedWorkflow.steps || []), { ...step, step_id: `step_${Date.now()}` }];
    updateWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      data: { steps }
    });
    setShowStepDialog(false);
  };

  const handleUpdateStep = (stepId, updates) => {
    const steps = selectedWorkflow.steps.map(s => s.step_id === stepId ? { ...s, ...updates } : s);
    updateWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      data: { steps }
    });
  };

  const handleDeleteStep = (stepId) => {
    const steps = selectedWorkflow.steps.filter(s => s.step_id !== stepId);
    updateWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      data: { steps }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light">Onboarding-Workflows</h2>
        <Button onClick={handleCreateWorkflow} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflow?.id === wf.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{wf.workflow_name}</p>
                    <p className="text-xs text-slate-600">{wf.steps?.length || 0} Schritte</p>
                  </div>
                  <div className="flex gap-1">
                    {wf.is_default && <Badge className="bg-green-100 text-green-800 text-xs">Standard</Badge>}
                    {wf.is_active && <Badge className="bg-blue-100 text-blue-800 text-xs">Aktiv</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Workflow Editor */}
        <div className="lg:col-span-2">
          {selectedWorkflow ? (
            <WorkflowEditor
              workflow={selectedWorkflow}
              admins={admins}
              onUpdate={(data) => updateWorkflowMutation.mutate({ id: selectedWorkflow.id, data })}
              onAddStep={() => setShowStepDialog(true)}
              onUpdateStep={handleUpdateStep}
              onDeleteStep={handleDeleteStep}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600">
                Wählen Sie einen Workflow aus oder erstellen Sie einen neuen
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showStepDialog && (
        <StepDialog
          onClose={() => setShowStepDialog(false)}
          onSave={handleAddStep}
          admins={admins}
          existingSteps={selectedWorkflow?.steps || []}
        />
      )}
    </div>
  );
}

function WorkflowEditor({ workflow, admins, onUpdate, onAddStep, onUpdateStep, onDeleteStep }) {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <Input
            value={workflow.workflow_name}
            onChange={(e) => onUpdate({ workflow_name: e.target.value })}
            className="text-lg font-semibold"
          />
          <Textarea
            placeholder="Beschreibung..."
            value={workflow.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={workflow.is_active}
                onCheckedChange={(checked) => onUpdate({ is_active: checked })}
              />
              <Label>Aktiv</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={workflow.is_default}
                onCheckedChange={(checked) => onUpdate({ is_default: checked })}
              />
              <Label>Standard-Workflow</Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onAddStep} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Schritt hinzufügen
        </Button>

        {/* Steps Visual Flow */}
        <div className="space-y-3">
          {(workflow.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((step, idx) => (
            <div key={step.step_id} className="relative">
              <div className="p-4 border border-slate-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-700">#{idx + 1}</span>
                      <p className="font-semibold">{step.title}</p>
                      <Badge className={`${step.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {step.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{step.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Fällig: +{step.due_days_offset} Tage</span>
                      {step.assigned_to && <span>→ {step.assigned_to}</span>}
                      {step.dependencies?.length > 0 && (
                        <span className="text-amber-700">
                          {step.dependencies.length} Abhängigkeit{step.dependencies.length > 1 ? 'en' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteStep(step.step_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {idx < workflow.steps.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StepDialog({ onClose, onSave, admins, existingSteps }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lock_type: 'custom',
    priority: 'medium',
    assigned_to: '',
    due_days_offset: 0,
    dependencies: [],
    is_visible_to_tenant: true,
    order: existingSteps.length
  });

  const handleSave = () => {
    if (!formData.title) {
      toast.error('Titel erforderlich');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow-Schritt hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Vertrag unterschreiben"
            />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Details zum Schritt..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priorität</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fällig in (Tagen)</Label>
              <Input
                type="number"
                value={formData.due_days_offset}
                onChange={(e) => setFormData({ ...formData, due_days_offset: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Zuweisen an</Label>
            <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
              <SelectTrigger><SelectValue placeholder="Admin wählen..." /></SelectTrigger>
              <SelectContent>
                {admins.map(a => (
                  <SelectItem key={a.email} value={a.email}>{a.full_name || a.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_visible_to_tenant}
              onCheckedChange={(checked) => setFormData({ ...formData, is_visible_to_tenant: checked })}
            />
            <Label>Für Mieter sichtbar</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}