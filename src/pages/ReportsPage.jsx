import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import PaymentAnalysis from '@/components/reports/PaymentAnalysis';
import IncomeExpenseOverview from '@/components/reports/IncomeExpenseOverview';
import ExportButton from '@/components/reporting/ExportButton';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Berichte"
        subtitle="Finanzberichte und Analysen"
        actions={
          <Button variant="gradient">Neuer Bericht</Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <PaymentAnalysis />
        <IncomeExpenseOverview />
      </div>
    </div>
  );
}