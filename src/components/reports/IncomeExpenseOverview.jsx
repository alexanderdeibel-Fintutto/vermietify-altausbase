import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function IncomeExpenseOverview() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' })
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const totalIncome = contracts.reduce((sum, c) => sum + (c.rent_cold || 0), 0);
  const totalExpenses = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Finanzübersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--vf-success-50)] rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--vf-success-600)]" />
              <span className="font-medium">Einnahmen</span>
            </div>
            <CurrencyDisplay amount={totalIncome} className="text-xl font-bold text-[var(--vf-success-600)]" />
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--vf-error-50)] rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-[var(--vf-error-600)]" />
              <span className="font-medium">Ausgaben</span>
            </div>
            <CurrencyDisplay amount={totalExpenses} className="text-xl font-bold text-[var(--vf-error-600)]" />
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--vf-primary-50)] rounded-lg">
            <span className="font-semibold">Netto-Einkommen</span>
            <CurrencyDisplay amount={netIncome} className="text-2xl font-bold text-[var(--vf-primary-600)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}