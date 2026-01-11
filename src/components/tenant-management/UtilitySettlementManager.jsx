import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Send, Check } from 'lucide-react';

export default function UtilitySettlementManager({ companyId }) {
  const queryClient = useQueryClient();

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements', companyId],
    queryFn: () => base44.asServiceRole.entities.UtilitySettlement.filter({ company_id: companyId })
  });

  const processMutation = useMutation({
    mutationFn: ({ settlementId, action }) =>
      base44.functions.invoke('processUtilitySettlement', { settlement_id: settlementId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settlements'] })
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'refunded': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Nebenkostenabrechnungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {settlements.map(settlement => {
          const balance = settlement.balance || 0;
          return (
            <div key={settlement.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {settlement.period_start} - {settlement.period_end}
                </span>
                <Badge className={getStatusColor(settlement.status)}>
                  {settlement.status}
                </Badge>
              </div>

              <div className="space-y-1 text-xs mb-2">
                <p>Vorauszahlung: {settlement.advance_payments}€</p>
                <p>Tatsächliche Kosten: {settlement.actual_costs}€</p>
                <p className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {balance > 0 ? 'Nachzahlung' : 'Rückerstattung'}: {Math.abs(balance)}€
                </p>
              </div>

              <div className="flex gap-2">
                {settlement.status === 'draft' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processMutation.mutate({ settlementId: settlement.id, action: 'calculate' })}
                      className="flex-1"
                    >
                      Berechnen
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => processMutation.mutate({ settlementId: settlement.id, action: 'send' })}
                      className="flex-1 gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Versenden
                    </Button>
                  </>
                )}
                {settlement.status === 'sent' && (
                  <Button
                    size="sm"
                    onClick={() => processMutation.mutate({ settlementId: settlement.id, action: 'mark_paid' })}
                    className="w-full gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Als bezahlt markieren
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}