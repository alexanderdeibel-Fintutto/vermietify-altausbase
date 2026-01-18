import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import RevenueWidget from '@/components/widgets/RevenueWidget';
import IncomeExpenseChart from '@/components/finance/IncomeExpenseChart';
import BudgetTracker from '@/components/finance/BudgetTracker';
import LoanTracker from '@/components/finance/LoanTracker';
import CashflowForecast from '@/components/finance/CashflowForecast';

export default function FinanceDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Finanzen"
        subtitle="Kompletter Finanz-Überblick"
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <RevenueWidget />
        <BudgetTracker />
        <LoanTracker />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <IncomeExpenseChart />
        <CashflowForecast months={6} />
      </div>
    </div>
  );
}