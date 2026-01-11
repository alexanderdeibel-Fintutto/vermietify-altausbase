import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, ArrowLeft } from 'lucide-react';

export default function DepositManager({ companyId }) {
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const queryClient = useQueryClient();

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', companyId],
    queryFn: () => base44.asServiceRole.entities.Deposit.filter({ company_id: companyId })
  });

  const calculateInterestMutation = useMutation({
    mutationFn: (depositId) =>
      base44.functions.invoke('calculateDepositInterest', { deposit_id: depositId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deposits'] })
  });

  const returnMutation = useMutation({
    mutationFn: ({ depositId, amount, deductions }) =>
      base44.asServiceRole.entities.Deposit.update(depositId, {
        status: 'returned',
        returned_amount: amount,
        return_date: new Date().toISOString().split('T')[0],
        deductions
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setSelectedDeposit(null);
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-700';
      case 'held': return 'bg-yellow-100 text-yellow-700';
      case 'returned': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (selectedDeposit) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDeposit(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-base">Kaution zurückzahlen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-sm">Kautionsbetrag: {selectedDeposit.amount}€</p>
            <p className="text-sm">Zinsen: {selectedDeposit.accrued_interest}€</p>
            <p className="text-sm font-medium mt-1">
              Gesamt: {selectedDeposit.amount + selectedDeposit.accrued_interest}€
            </p>
          </div>

          <Button
            onClick={() => returnMutation.mutate({ 
              depositId: selectedDeposit.id, 
              amount: selectedDeposit.amount + selectedDeposit.accrued_interest,
              deductions: []
            })}
            className="w-full"
          >
            Vollständig zurückzahlen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Kautionsverwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {deposits.map(deposit => (
          <div key={deposit.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{deposit.amount}€</span>
              <Badge className={getStatusColor(deposit.status)}>
                {deposit.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Zinsen: {deposit.accrued_interest || 0}€
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => calculateInterestMutation.mutate(deposit.id)}
                className="flex-1 gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Zinsen berechnen
              </Button>
              {deposit.status !== 'returned' && (
                <Button
                  size="sm"
                  onClick={() => setSelectedDeposit(deposit)}
                  className="flex-1"
                >
                  Zurückzahlen
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}