import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Send } from 'lucide-react';

export default function SEPAMandateManager({ companyId }) {
  const queryClient = useQueryClient();

  const { data: mandates = [] } = useQuery({
    queryKey: ['sepa-mandates', companyId],
    queryFn: () => base44.asServiceRole.entities.SEPAMandate.filter({ company_id: companyId })
  });

  const debitMutation = useMutation({
    mutationFn: ({ mandateId, amount }) =>
      base44.functions.invoke('processSEPADebit', { 
        mandate_id: mandateId, 
        amount, 
        purpose: 'Mietzahlung' 
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sepa-mandates'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          SEPA-Lastschrift
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mandates.map(mandate => (
          <div key={mandate.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{mandate.account_holder}</span>
              <Badge className={mandate.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}>
                {mandate.status}
              </Badge>
            </div>
            <div className="text-xs space-y-1 mb-2">
              <p>IBAN: {mandate.iban}</p>
              <p>Ref: {mandate.mandate_reference}</p>
              {mandate.last_debit_date && <p>Letzte Abbuchung: {mandate.last_debit_date}</p>}
            </div>
            {mandate.status === 'active' && (
              <Button
                size="sm"
                onClick={() => debitMutation.mutate({ mandateId: mandate.id, amount: 1000 })}
                className="w-full gap-1"
              >
                <Send className="w-3 h-3" />
                Lastschrift einziehen
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}