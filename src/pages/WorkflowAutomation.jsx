import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Play, Pause, Edit, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';

export default function WorkflowAutomation() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow.list('-created_date')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Workflow.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow gelöscht');
    }
  });

  const triggerLabels = {
    manual: 'Manuell',
    schedule: 'Zeitgesteuert',
    entity_create: 'Entity erstellt',
    entity_update: 'Entity aktualisiert',
    email_received: 'Email empfangen'
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Automation</h1>
          <p className="text-slate-600">Automatisieren Sie wiederkehrende Aufgaben</p>
        </div>
        <Button 
          onClick={() => {
            setEditingWorkflow(null);
            setBuilderOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Workflow erstellen
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { value: workflows.length, label: "Gesamt", color: "slate" },
          { value: workflows.filter(w => w.is_active).length, label: "Aktiv", color: "green" },
          { value: workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0), label: "Ausführungen", color: "blue" },
          { value: workflows.filter(w => w.trigger_type === 'schedule').length, label: "Zeitgesteuert", color: "purple" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-6">
            <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
            <div className="text-sm text-slate-600">{stat.label}</div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflows.map((workflow, idx) => (
              <motion.div 
                key={workflow.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-medium text-slate-900">{workflow.name}</h3>
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Badge variant="outline">{triggerLabels[workflow.trigger_type]}</Badge>
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-slate-600 mb-3">{workflow.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{workflow.steps?.length || 0} Schritte</span>
                      <span>•</span>
                      <span>{workflow.execution_count || 0} Ausführungen</span>
                      {workflow.last_executed && (
                        <>
                          <span>•</span>
                          <span>Zuletzt: {new Date(workflow.last_executed).toLocaleString('de-DE')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workflow.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: workflow.id, is_active: checked })}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingWorkflow(workflow);
                        setBuilderOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <WorkflowBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        workflow={editingWorkflow}
      />
    </div>
  );
}