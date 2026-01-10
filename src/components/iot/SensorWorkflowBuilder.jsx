import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SensorWorkflowBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    sensor_type: 'temperature',
    condition: 'above_threshold',
    threshold_value: 0,
    actions: [{ type: 'create_maintenance_task' }],
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: sensorWorkflows = [] } = useQuery({
    queryKey: ['sensor-workflows'],
    queryFn: async () => {
      return await base44.entities.WorkflowAutomation.filter({
        trigger_type: 'event',
        'trigger_config.event_type': 'sensor_alarm'
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.WorkflowAutomation.create({
        name: formData.name,
        description: `Automatische Aktion bei Sensor-Alarm`,
        trigger_type: 'event',
        trigger_config: {
          event_type: 'sensor_alarm',
          sensor_type: formData.sensor_type,
          condition: formData.condition,
          threshold: formData.threshold_value
        },
        actions: formData.actions.map(a => ({
          type: a.type,
          config: {}
        })),
        category: 'maintenance',
        is_active: formData.is_active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sensor-workflows']);
      toast.success('Sensor-Workflow erstellt');
      setFormData({
        name: '',
        sensor_type: 'temperature',
        condition: 'above_threshold',
        threshold_value: 0,
        actions: [{ type: 'create_maintenance_task' }],
        is_active: true
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkflowAutomation.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['sensor-workflows']);
      toast.success('Workflow gelöscht');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Neuer Sensor-Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Workflow-Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Temperatur-Alarm-Wartung"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Sensor-Typ</label>
              <Select
                value={formData.sensor_type}
                onValueChange={(value) => setFormData({ ...formData, sensor_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">Temperatur</SelectItem>
                  <SelectItem value="humidity">Luftfeuchtigkeit</SelectItem>
                  <SelectItem value="energy">Energie</SelectItem>
                  <SelectItem value="smoke">Rauch</SelectItem>
                  <SelectItem value="leak">Wasserleck</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Bedingung</label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above_threshold">Über Schwellwert</SelectItem>
                  <SelectItem value="below_threshold">Unter Schwellwert</SelectItem>
                  <SelectItem value="any_alarm">Beliebiger Alarm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm">Workflow aktiviert</span>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!formData.name || createMutation.isPending}
            className="w-full"
          >
            Workflow erstellen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktive Sensor-Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          {sensorWorkflows.length === 0 ? (
            <p className="text-center text-slate-600 py-4">Keine Workflows konfiguriert</p>
          ) : (
            <div className="space-y-2">
              {sensorWorkflows.map(workflow => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{workflow.name}</p>
                    <p className="text-xs text-slate-600">
                      {workflow.trigger_config?.sensor_type} - {workflow.trigger_config?.condition}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workflow.is_active ? (
                      <Badge className="bg-green-500">Aktiv</Badge>
                    ) : (
                      <Badge className="bg-slate-500">Inaktiv</Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}