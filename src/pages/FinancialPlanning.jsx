import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import InvestmentPlanner from '@/components/planning/InvestmentPlanner';
import LoanTracker from '@/components/finance/LoanTracker';
import CashflowForecast from '@/components/finance/CashflowForecast';

export default function FinancialPlanning() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Finanzplanung"
        subtitle="Planen Sie Ihre Investitionen und verwalten Sie Ihre Finanzen"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <InvestmentPlanner />
        <LoanTracker />
      </div>

      <CashflowForecast months={12} />
    </div>
  );
}