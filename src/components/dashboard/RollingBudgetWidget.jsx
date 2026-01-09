import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown } from 'lucide-react';

export default function RollingBudgetWidget() {
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['rollingBudgets'],
    queryFn: async () => {
      try {
        return await base44.entities.RollingBudget.list('-created_at', 10);
      } catch {
        return [];
      }
    }
  });

  const { data: selectedBudget } = useQuery({
    queryKey: ['selectedBudget', selectedBudgetId],
    queryFn: async () => {
      if (!selectedBudgetId) return null;
      try {
        const b = await base44.entities.RollingBudget.filter({ id: selectedBudgetId }, null, 1);
        return b[0];
      } catch {
        return null;
      }
    },
    enabled: !!selectedBudgetId
  });

  const currentBudget = selectedBudget || budgets?.[0];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine rollierenden Budgets</p>
        </CardContent>
      </Card>
    );
  }

  const currentPeriod = currentBudget?.periods?.[0];
  const totalBudget = currentPeriod
    ? Object.values(currentPeriod.category_budgets || {}).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-green-600" />
          Rollierende Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets && budgets.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {budgets.map(budget => (
              <button
                key={budget.id}
                onClick={() => setSelectedBudgetId(budget.id)}
                className={`px-3 py-1 rounded text-xs font-semibold transition whitespace-nowrap ${
                  currentBudget?.id === budget.id
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {budget.budget_name}
              </button>
            ))}
          </div>
        )}

        {currentBudget && currentPeriod && (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-semibold mb-1">{currentBudget.budget_name}</p>
              <p className="text-xs text-slate-600">
                Periode: {currentPeriod.period_start} - {currentPeriod.period_end}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded">
              <p className="text-xs text-slate-600 mb-2">Gesamtbudget</p>
              <p className="text-2xl font-bold">{totalBudget.toLocaleString('de-DE')} €</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Kategorien</p>
              {Object.entries(currentPeriod.category_budgets || {}).slice(0, 5).map(([category, amount]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{category}</span>
                    <span className="text-xs text-slate-600">{amount.toLocaleString('de-DE')} €</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${(amount / totalBudget) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}