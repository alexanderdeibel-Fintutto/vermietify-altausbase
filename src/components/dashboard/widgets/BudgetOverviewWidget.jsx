import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BudgetOverviewWidget() {
  const currentYear = new Date().getFullYear();

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', currentYear],
    queryFn: () => base44.entities.Budget.filter({ year: currentYear })
  });

  const totalPlanned = budgets.reduce((sum, b) => sum + (b.planned_amount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + (b.actual_amount || 0), 0);
  const utilizationPercent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  const topBudgets = budgets
    .map(b => ({
      ...b,
      utilization: b.planned_amount > 0 ? (b.actual_amount / b.planned_amount) * 100 : 0
    }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Budget-Übersicht {currentYear}</CardTitle>
          <Link to={createPageUrl('BudgetPlanning')}>
            <DollarSign className="w-5 h-5 text-slate-500 hover:text-slate-700" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Gesamt</span>
            <span className="text-sm font-semibold">
              {utilizationPercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={utilizationPercent} className="h-2" />
          <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
            <span>{totalActual.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
            <span>{totalPlanned.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
          </div>
        </div>

        {/* Top Budgets */}
        {topBudgets.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            {topBudgets.map((budget) => (
              <div key={budget.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{budget.name}</span>
                  <span className="text-xs text-slate-600">
                    {budget.utilization.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={budget.utilization} 
                  className={`h-1.5 ${budget.utilization > 100 ? 'bg-red-100' : ''}`}
                />
              </div>
            ))}
          </div>
        )}

        {budgets.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine Budgets für {currentYear}
          </p>
        )}
      </CardContent>
    </Card>
  );
}