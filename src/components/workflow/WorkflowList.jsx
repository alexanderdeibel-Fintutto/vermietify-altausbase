import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Pause, Edit, Trash2, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowList({ onEdit }) {
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const data = await base44.entities.WorkflowAutomation.list('-created_date');
      return data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.WorkflowAutomation.update(id, { is_active: !is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Status aktualisiert');
    }
  });

  const runMutation = useMutation({
    mutationFn: async (workflow) => {
      const response = await base44.functions.invoke('executeWorkflow', { workflow_id: workflow.id });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Workflow ausgeführt: ${data.affected} Datensätze bearbeitet`);
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WorkflowAutomation.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow gelöscht');
    }
  });

  const categoryColors = {
    payment: 'bg-red-100 text-red-800',
    contract: 'bg-blue-100 text-blue-800',
    document: 'bg-purple-100 text-purple-800',
    maintenance: 'bg-orange-100 text-orange-800',
    communication: 'bg-green-100 text-green-800'
  };

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <Card key={workflow.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <Badge className={categoryColors[workflow.category]}>
                    {workflow.category}
                  </Badge>
                  {workflow.is_active ? (
                    <Badge className="bg-green-600">Aktiv</Badge>
                  ) : (
                    <Badge variant="outline">Inaktiv</Badge>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-3">{workflow.description}</p>

                <div className="flex gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {workflow.trigger_type === 'scheduled' ? 'Zeitgesteuert' : 
                     workflow.trigger_type === 'event' ? 'Ereignis' : 'Manuell'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {workflow.actions?.length || 0} Aktionen
                  </div>
                  {workflow.last_run && (
                    <div>
                      Letzte Ausführung: {new Date(workflow.last_run).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    Ausführungen: {workflow.run_count || 0}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={workflow.is_active}
                    onCheckedChange={() => toggleMutation.mutate(workflow)}
                  />
                  <span className="text-xs text-slate-600">
                    {workflow.is_active ? 'Aktiv' : 'Pausiert'}
                  </span>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runMutation.mutate(workflow)}
                    disabled={runMutation.isPending}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(workflow)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(workflow.id)}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {workflows.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Noch keine Workflows erstellt</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}