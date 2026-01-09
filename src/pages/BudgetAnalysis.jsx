import React from 'react';
import BudgetVsActualWidget from '@/components/dashboard/BudgetVsActualWidget';
import RollingBudgetComparisonWidget from '@/components/dashboard/RollingBudgetComparisonWidget';

export default function BudgetAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Budget-Analyse</h1>
        <p className="text-sm text-slate-600 mt-2">
          Vergleichen Sie Ihre tatsächlichen Ausgaben mit dem Budget über verschiedene Zeiträume
        </p>
      </div>

      {/* Budget vs Actual */}
      <BudgetVsActualWidget />

      {/* Rolling Budget Comparison */}
      <RollingBudgetComparisonWidget />
    </div>
  );
}