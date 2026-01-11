import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';

export default function DLPRuleManager({ companyId }) {
  const [ruleName, setRuleName] = useState('');
  const [patternType, setPatternType] = useState('credit_card');
  const [action, setAction] = useState('notify');
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['dlp-rules', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DLPRule.filter({ company_id: companyId });
      return result;
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.DLPRule.create({
        company_id: companyId,
        name: ruleName,
        pattern_type: patternType,
        action,
        severity: 'high',
        is_active: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlp-rules'] });
      setRuleName('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.DLPRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dlp-rules'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          DLP-Regeln
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Regelname"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          className="text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={patternType}
            onChange={(e) => setPatternType(e.target.value)}
            className="p-2 border rounded text-sm"
          >
            <option value="credit_card">Kreditkarte</option>
            <option value="iban">IBAN</option>
            <option value="ssn">SSN</option>
            <option value="email">E-Mail</option>
            <option value="phone">Telefon</option>
          </select>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="p-2 border rounded text-sm"
          >
            <option value="notify">Benachrichtigen</option>
            <option value="redact">Schwärzen</option>
            <option value="block">Blockieren</option>
          </select>
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!ruleName || createMutation.isPending}
          className="w-full gap-2"
        >
          <Plus className="w-3 h-3" />
          Regel erstellen
        </Button>

        {/* Rules List */}
        <div className="space-y-1 pt-3 border-t">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{rule.name}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">{rule.pattern_type}</Badge>
                  <Badge className="text-xs">{rule.action}</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(rule.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}