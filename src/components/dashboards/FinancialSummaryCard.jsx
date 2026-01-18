import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function FinancialSummaryCard({ income = 0, expenses = 0 }) {
  const net = income - expenses;
  const isPositive = net >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finanz-Übersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--theme-text-secondary)]">Einnahmen</span>
            <CurrencyDisplay amount={income} colored />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--theme-text-secondary)]">Ausgaben</span>
            <CurrencyDisplay amount={expenses} colored />
          </div>
          <div className="pt-3 border-t border-[var(--theme-border)]">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Netto</span>
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-[var(--vf-success-500)]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[var(--vf-error-500)]" />
                )}
                <CurrencyDisplay amount={net} colored />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}