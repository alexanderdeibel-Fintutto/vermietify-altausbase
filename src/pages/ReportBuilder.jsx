import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import CustomReportBuilder from '@/components/reporting/CustomReportBuilder';
import ReportScheduler from '@/components/reporting/ReportScheduler';

export default function ReportBuilder() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Berichts-Generator"
        subtitle="Erstellen Sie benutzerdefinierte Berichte"
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <CustomReportBuilder />
        <ReportScheduler />
      </div>
    </div>
  );
}