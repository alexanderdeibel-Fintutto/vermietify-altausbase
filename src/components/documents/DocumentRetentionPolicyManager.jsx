import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

export default function DocumentRetentionPolicyManager({ companyId }) {
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('');
  const [retentionDays, setRetentionDays] = useState('365');
  const [action, setAction] = useState('archive');
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery({
    queryKey: ['retention-policies', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DocumentRetentionPolicy.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.DocumentRetentionPolicy.create({
        company_id: companyId,
        name,
        document_type: docType,
        retention_days: parseInt(retentionDays),
        action_after_retention: action,
        is_active: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention-policies'] });
      setName('');
      setDocType('');
      setRetentionDays('365');
      setAction('archive');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.DocumentRetentionPolicy.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retention-policies'] })
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aufbewahrungsrichtlinie erstellen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Richtlinienname"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Dokumenttyp"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Aufbewahrungstage"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
          />
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Löschen</SelectItem>
              <SelectItem value="archive">Archivieren</SelectItem>
              <SelectItem value="anonymize">Anonymisieren</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || !docType || createMutation.isPending}
            className="w-full"
          >
            Erstellen
          </Button>
        </CardContent>
      </Card>

      {/* Policies List */}
      <div className="space-y-2">
        {policies.map(policy => (
          <Card key={policy.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{policy.name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {policy.document_type} - {policy.retention_days} Tage
                  </p>
                  <Badge className="mt-2" variant="outline">
                    {policy.action_after_retention}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(policy.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}