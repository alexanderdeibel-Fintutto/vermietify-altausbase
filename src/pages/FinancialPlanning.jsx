import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import FinancialForecastWidget from '@/components/financial-analysis/FinancialForecastWidget';
import ROIDashboard from '@/components/financial-analysis/ROIDashboard';
import CashflowForecast from '@/components/finance/CashflowForecast';
import BudgetTracker from '@/components/finance/BudgetTracker';

export default function FinancialPlanning() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Finanzplanung"
        subtitle="Prognosen und Budgetierung"
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <FinancialForecastWidget />
        <CashflowForecast months={6} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <ROIDashboard />
        <BudgetTracker />
      </div>
    </div>
  );
}