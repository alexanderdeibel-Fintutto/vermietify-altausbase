import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Plus, Sparkles } from 'lucide-react';
import WorkflowEngineBuilder from '@/components/workflow/WorkflowEngineBuilder';
import WorkflowTemplates from '@/components/workflow/WorkflowTemplates';
import WorkflowList from '@/components/workflow/WorkflowList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function WorkflowAutomationHub() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const handleTemplateSelect = (template) => {
    setEditingWorkflow(template);
    setShowBuilder(true);
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  const handleClose = () => {
    setShowBuilder(false);
    setEditingWorkflow(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Workflow-Automatisierung</h1>
            <p className="text-slate-600">Erstellen Sie intelligente Automatisierungsregeln</p>
          </div>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Workflow
        </Button>
      </div>

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">Meine Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-none">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Workflow-Engine Features</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">✓ Zeitgesteuert</p>
                      <p className="text-slate-600">Cron-basierte Ausführung</p>
                    </div>
                    <div>
                      <p className="font-semibold">✓ Ereignisbasiert</p>
                      <p className="text-slate-600">Trigger bei Datenänderungen</p>
                    </div>
                    <div>
                      <p className="font-semibold">✓ Multi-Action</p>
                      <p className="text-slate-600">Mehrere Aktionen pro Workflow</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <WorkflowList onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-none">
            <CardContent className="p-6">
              <h3 className="font-bold mb-2">Vorgefertigte Templates</h3>
              <p className="text-sm text-slate-600">
                Nutzen Sie bewährte Workflow-Templates und passen Sie diese an Ihre Bedürfnisse an
              </p>
            </CardContent>
          </Card>

          <WorkflowTemplates onSelect={handleTemplateSelect} />
        </TabsContent>
      </Tabs>

      <Dialog open={showBuilder} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow?.id ? 'Workflow bearbeiten' : 'Neuer Workflow'}
            </DialogTitle>
          </DialogHeader>
          <WorkflowEngineBuilder workflow={editingWorkflow} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}