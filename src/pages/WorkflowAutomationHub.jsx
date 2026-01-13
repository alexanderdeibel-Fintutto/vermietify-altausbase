import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import RuleBuilder from '@/components/workflow/RuleBuilder';
import ExecutionMonitor from '@/components/workflow/ExecutionMonitor';

export default function WorkflowAutomationHub() {
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow?.list?.('-updated_date', 50) || []
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['rules'],
    queryFn: () => base44.entities.WorkflowRule?.list?.('-updated_date', 50) || []
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workflow Automation</h1>
        <p className="text-slate-600 text-sm mt-1">Automatisieren Sie wiederkehrende Aufgaben</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">⚙️ Workflows</TabsTrigger>
          <TabsTrigger value="rules">📋 Rules</TabsTrigger>
          <TabsTrigger value="monitor">📊 Monitor</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workflows</h2>
            <Button onClick={() => setShowNewWorkflow(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Neu
            </Button>
          </div>

          <div className="grid gap-3">
            {workflows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-slate-500">Keine Workflows</p>
                </CardContent>
              </Card>
            ) : (
              workflows.map(workflow => (
                <Card key={workflow.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <p className="text-xs text-slate-600">{workflow.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-slate-500">
                          <span>Ausführungen: {workflow.execution_count}</span>
                          <span>✓ {workflow.success_count}</span>
                          <span>✗ {workflow.error_count}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {workflow.is_active ? (
                          <span className="text-xs text-emerald-600">✓ Aktiv</span>
                        ) : (
                          <span className="text-xs text-slate-500">Inaktiv</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Automation Rules</h2>
            <Button onClick={() => setShowNewRule(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Neu
            </Button>
          </div>

          <div className="grid gap-3">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-slate-500">Keine Rules</p>
                </CardContent>
              </Card>
            ) : (
              rules.map(rule => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        If {rule.entity_type} → {JSON.parse(rule.actions).length} actions
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Executions: {rule.execution_count}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle>Execution Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <ExecutionMonitor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Workflow Dialog */}
      <Dialog open={showNewWorkflow} onOpenChange={setShowNewWorkflow}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neuer Workflow</DialogTitle>
          </DialogHeader>
          <WorkflowBuilder onSave={() => setShowNewWorkflow(false)} />
        </DialogContent>
      </Dialog>

      {/* New Rule Dialog */}
      <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue Rule</DialogTitle>
          </DialogHeader>
          <RuleBuilder />
        </DialogContent>
      </Dialog>
    </div>
  );
}