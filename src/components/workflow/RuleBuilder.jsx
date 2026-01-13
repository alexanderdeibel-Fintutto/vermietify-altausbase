import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ACTION_TYPES = [
  { id: 'update', label: 'Feld aktualisieren' },
  { id: 'notify', label: 'Benachrichtigung' },
  { id: 'create_task', label: 'Task erstellen' },
  { id: 'assign_to', label: 'Zuweisen' }
];

export default function RuleBuilder({ rule = null }) {
  const [name, setName] = useState(rule?.name || '');
  const [entityType, setEntityType] = useState(rule?.entity_type || 'Invoice');
  const [condition, setCondition] = useState(rule?.condition ? JSON.parse(rule.condition) : { field: '', operator: '', value: '' });
  const [actions, setActions] = useState(rule?.actions ? JSON.parse(rule.actions) : []);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (rule?.id) {
        await base44.entities.WorkflowRule?.update?.(rule.id, {
          name: name,
          entity_type: entityType,
          condition: JSON.stringify(condition),
          actions: JSON.stringify(actions)
        });
      } else {
        await base44.entities.WorkflowRule?.create?.({
          name: name,
          entity_type: entityType,
          condition: JSON.stringify(condition),
          actions: JSON.stringify(actions)
        });
      }
    },
    onSuccess: () => {
      toast.success('✅ Rule gespeichert');
      queryClient.invalidateQueries(['rules']);
    }
  });

  const addAction = (actionType) => {
    setActions([...actions, { id: `action_${Date.now()}`, type: actionType }]);
  };

  return (
    <div className="space-y-4">
      {/* Condition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bedingung (If)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Feld"
              value={condition.field}
              onChange={(e) => setCondition({ ...condition, field: e.target.value })}
            />
            <Select value={condition.operator} onValueChange={(v) => setCondition({ ...condition, operator: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">=</SelectItem>
                <SelectItem value="gt">></SelectItem>
                <SelectItem value="lt"><</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Wert"
              value={condition.value}
              onChange={(e) => setCondition({ ...condition, value: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aktionen (Then)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.length > 0 && (
            <div className="space-y-2">
              {actions.map((action, idx) => (
                <Badge key={action.id} variant="secondary">
                  {idx + 1}. {ACTION_TYPES.find(a => a.id === action.type)?.label}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            {ACTION_TYPES.map(action => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                onClick={() => addAction(action.id)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={!name || !condition.field || actions.length === 0 || saveMutation.isPending}
        className="w-full gap-2"
      >
        <Save className="w-4 h-4" />
        Speichern
      </Button>
    </div>
  );
}