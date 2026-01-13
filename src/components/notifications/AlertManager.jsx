import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AlertManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('Invoice');
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: () => base44.entities.AlertRule?.list?.('-updated_date', 50) || []
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.AlertRule?.create?.({
        name: name,
        entity_type: entityType,
        trigger_condition: JSON.stringify({ field: 'status', operator: 'equals', value: 'overdue' }),
        alert_message: `Alert: ${name}`,
        channels: JSON.stringify(['in-app', 'email'])
      });
    },
    onSuccess: () => {
      toast.success('✅ Alert-Rule erstellt');
      queryClient.invalidateQueries(['alert-rules']);
      setName('');
      setShowDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId) => {
      await base44.entities.AlertRule?.delete?.(ruleId);
    },
    onSuccess: () => {
      toast.success('✅ Rule gelöscht');
      queryClient.invalidateQueries(['alert-rules']);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Alert Rules</h3>
        <Button size="sm" onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neu
        </Button>
      </div>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Alert-Rules</p>
        ) : (
          rules.map(rule => (
            <Card key={rule.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{rule.entity_type}</Badge>
                      {rule.is_active && <Badge className="text-xs">✓ Aktiv</Badge>}
                      <span className="text-xs text-slate-500">Triggers: {rule.trigger_count}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Alert Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Rule Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Invoice">Rechnung</SelectItem>
                <SelectItem value="Contract">Vertrag</SelectItem>
                <SelectItem value="Payment">Zahlung</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!name || createMutation.isPending}
              >
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}