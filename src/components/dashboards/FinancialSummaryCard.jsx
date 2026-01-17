import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { Euro, TrendingUp, TrendingDown } from 'lucide-react';

export default function FinancialSummaryCard() {
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const totalIncome = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.rent_cold || 0), 0);

  const totalExpenses = invoices
    .filter(i => i.payment_date)
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const netIncome = totalIncome - totalExpenses;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Finanzübersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--vf-success-500)]" />
            <span className="text-sm">Einnahmen</span>
          </div>
          <CurrencyDisplay amount={totalIncome} colored />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-[var(--vf-error-500)]" />
            <span className="text-sm">Ausgaben</span>
          </div>
          <CurrencyDisplay amount={totalExpenses} colored />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Netto</span>
            <CurrencyDisplay 
              amount={netIncome} 
              colored 
              className="text-lg font-bold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}