import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function RentIncreaseAssistant({ companyId }) {
  const [contractId, setContractId] = useState('');
  const [proposedRent, setProposedRent] = useState('');
  const [reason, setReason] = useState('local_comparison');
  const [referenceRent, setReferenceRent] = useState('');
  const queryClient = useQueryClient();

  const { data: increases = [] } = useQuery({
    queryKey: ['rent-increases', companyId],
    queryFn: () => base44.asServiceRole.entities.RentIncrease.filter({ company_id: companyId })
  });

  const calculateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('calculateRentIncrease', {
        contract_id: contractId,
        proposed_rent: parseFloat(proposedRent),
        reason,
        local_reference_rent: parseFloat(referenceRent)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-increases'] });
      setContractId('');
      setProposedRent('');
      setReferenceRent('');
    }
  });

  const result = calculateMutation.data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Mieterhöhungs-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Vertrags-ID"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          className="text-sm"
        />
        <Input
          type="number"
          placeholder="Neue Miete (€)"
          value={proposedRent}
          onChange={(e) => setProposedRent(e.target.value)}
          className="text-sm"
        />
        <Input
          type="number"
          placeholder="Ortsübliche Vergleichsmiete (€)"
          value={referenceRent}
          onChange={(e) => setReferenceRent(e.target.value)}
          className="text-sm"
        />
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        >
          <option value="local_comparison">Ortsübliche Vergleichsmiete</option>
          <option value="modernization">Modernisierung</option>
          <option value="index">Indexmiete</option>
          <option value="other">Sonstiges</option>
        </select>

        <Button
          onClick={() => calculateMutation.mutate()}
          disabled={!contractId || !proposedRent || calculateMutation.isPending}
          className="w-full"
        >
          Kappungsgrenze prüfen
        </Button>

        {result && (
          <div className={`p-3 rounded ${result.warning ? 'bg-red-50' : 'bg-green-50'}`}>
            {result.warning && (
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">{result.warning}</span>
              </div>
            )}
            <div className="text-xs space-y-1">
              <p>Erhöhung: {result.rent_increase.increase_amount}€ ({result.rent_increase.increase_percentage}%)</p>
              <p>Max. erlaubt (Kappung): {result.rent_increase.cap_limit_check.max_allowed}€</p>
              <p className={result.rent_increase.cap_limit_check.is_compliant ? 'text-green-700' : 'text-red-700'}>
                {result.rent_increase.cap_limit_check.is_compliant ? '✓ Konform' : '✗ Nicht konform'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-3 border-t">
          {increases.slice(0, 3).map(inc => (
            <div key={inc.id} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between">
                <span>{inc.current_rent}€ → {inc.proposed_rent}€</span>
                <Badge variant={inc.cap_limit_check?.is_compliant ? 'outline' : 'destructive'}>
                  {inc.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}