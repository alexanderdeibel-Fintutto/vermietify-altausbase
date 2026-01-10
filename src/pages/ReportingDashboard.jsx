import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateRangeSelector from '@/components/reporting/DateRangeSelector';
import MetricsOverview from '@/components/reporting/MetricsOverview';
import EfficiencyMetrics from '@/components/reporting/EfficiencyMetrics';
import ReportingCharts from '@/components/reporting/ReportingCharts';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportingDashboard() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['reporting-metrics', fromDate, toDate],
    queryFn: () =>
      base44.functions.invoke('generateReportingMetrics', {
        from_date: fromDate,
        to_date: toDate,
        company_id: user?.id
      })
  });

  const metricsData = metrics?.data?.metrics || {};

  const handleExportReport = () => {
    const reportData = {
      generated_at: new Date().toLocaleString('de-DE'),
      period: `${fromDate} bis ${toDate}`,
      metrics: metricsData
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2)));
    element.setAttribute('download', `report_${fromDate}_${toDate}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Reporting Dashboard
        </h1>
        <p className="text-slate-600 mt-1">Umfassende Übersicht über Dokumentverarbeitung, Aufgaben und Workflow-Effizienz</p>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportReport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Bericht als JSON exportieren
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Metrics Overview */}
          <MetricsOverview metrics={metricsData} />

          {/* Efficiency Metrics */}
          <EfficiencyMetrics metrics={metricsData} />

          {/* Charts */}
          <ReportingCharts metrics={metricsData} />
        </>
      )}
    </div>
  );
}