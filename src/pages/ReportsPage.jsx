import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPageHeader } from '@/components/list-pages/VfListPage';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import ReportTable from '@/components/reports/ReportTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date')
  });

  const handleView = (report) => {
    console.log('View report:', report);
  };

  const handleDownload = (report) => {
    console.log('Download report:', report);
  };

  return (
    <div className="p-6">
      <VfListPageHeader
        title="Berichte"
        description="Alle Berichte im Überblick"
        actions={
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Bericht
          </Button>
        }
      />

      <ReportFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateRange={dateRange}
        onDateChange={setDateRange}
        reportType={reportType}
        onTypeChange={setReportType}
      />

      <div className="mt-6">
        <ReportTable
          reports={reports}
          onView={handleView}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}