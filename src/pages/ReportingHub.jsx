import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ReportScheduler from '@/components/reporting/ReportScheduler';
import ExportButton from '@/components/reporting/ExportButton';
import IncomeExpenseOverview from '@/components/reports/IncomeExpenseOverview';
import PaymentAnalysis from '@/components/reports/PaymentAnalysis';

export default function ReportingHub() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Berichte & Analysen"
        subtitle="Erstellen und verwalten Sie Ihre Berichte"
        actions={<ExportButton filename="vermitify-bericht" />}
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <IncomeExpenseOverview />
        <PaymentAnalysis />
      </div>

      <ReportScheduler />
    </div>
  );
}