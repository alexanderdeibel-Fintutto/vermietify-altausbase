import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import IncomeExpenseChart from '@/components/finance/IncomeExpenseChart';
import CashflowForecast from '@/components/finance/CashflowForecast';
import BudgetTracker from '@/components/finance/BudgetTracker';
import QuickStatsGrid from '@/components/shared/QuickStatsGrid';
import { Euro, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function FinanceDashboard() {
  const stats = [
    { label: 'Mieteinnahmen', value: '€15.800', icon: Euro, variant: 'highlighted' },
    { label: 'Ausgaben', value: '€8.950', icon: TrendingDown },
    { label: 'Netto', value: '€6.850', icon: TrendingUp },
    { label: 'Budget verfügbar', value: '€3.500', icon: Wallet }
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Finanzen"
        subtitle="Übersicht Ihrer Einnahmen und Ausgaben"
      />

      <QuickStatsGrid stats={stats} />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <IncomeExpenseChart />
        <CashflowForecast />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <BudgetTracker budget={10000} spent={6500} category="Instandhaltung" />
        <BudgetTracker budget={5000} spent={3200} category="Verwaltung" />
        <BudgetTracker budget={8000} spent={7800} category="Versicherungen" />
      </div>
    </div>
  );
}