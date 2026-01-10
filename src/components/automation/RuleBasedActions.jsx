import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function RuleBasedActions() {
  const [ruleName, setRuleName] = useState('');
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAutomationRules', {});
      return response.data.rules;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('createRule', { name: ruleName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success('Regel erstellt');
      setRuleName('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Automatisierungs-Regeln
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Regel-Name" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
          <Button size="icon" onClick={() => createMutation.mutate()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {rules.map(rule => (
          <div key={rule.id} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-sm">{rule.name}</p>
            <Badge className="mt-1 bg-green-600 text-xs">
              {rule.executions} Ausführungen
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}