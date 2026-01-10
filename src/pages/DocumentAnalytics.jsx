import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DocumentMetricsCards from '@/components/analytics/DocumentMetricsCards';
import SignatureStatusChart from '@/components/analytics/SignatureStatusChart';
import DocumentActivityChart from '@/components/analytics/DocumentActivityChart';
import TemplateUsageChart from '@/components/analytics/TemplateUsageChart';
import { BarChart3, Download } from 'lucide-react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function DocumentAnalytics() {
  const { companyId } = useParams();
  const [days, setDays] = useState('30');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['document-analytics', companyId, days],
    queryFn: async () => {
      const result = await base44.functions.invoke('getDocumentAnalytics', {
        company_id: companyId,
        days: parseInt(days)
      });
      return result.data;
    },
    enabled: !!companyId
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => base44.entities.DocumentTemplate.list(),
    staleTime: 10 * 60 * 1000
  });

  const handleExport = async () => {
    const csv = [
      ['Metrik', 'Wert'],
      ['Dokumente erstellt', analytics?.metrics?.documents_created || 0],
      ['Signaturanfragen', analytics?.signatureStats?.total || 0],
      ['Abgeschlossene Signaturen', analytics?.signatureStats?.completed || 0],
      ['Ausstehende Signaturen', analytics?.signatureStats?.pending || 0],
      ['Abgelehnte Signaturen', analytics?.signatureStats?.rejected || 0],
      ['Templates genutzt', analytics?.metrics?.templates_used || 0],
      ['Batch Uploads', analytics?.metrics?.batch_uploads || 0]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Dokumentverwaltungs-Analytics
            </h1>
            <p className="text-slate-600 mt-1">Übersicht Ihrer Dokumentaktivitäten und Signaturen</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Letzte 7 Tage</SelectItem>
                <SelectItem value="30">Letzte 30 Tage</SelectItem>
                <SelectItem value="90">Letzte 90 Tage</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportieren</span>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <DocumentMetricsCards analytics={analytics} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SignatureStatusChart signatureStats={analytics?.signatureStats} />
          <TemplateUsageChart
            templateUsage={analytics?.templateUsage || []}
            templates={templates}
          />
        </div>

        {/* Activity Chart */}
        <DocumentActivityChart dailyData={analytics?.dailyData || []} />

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Zusammenfassung</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-600">Durchschn. tägl. Dokumente</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {analytics?.metrics?.documents_created
                    ? (analytics.metrics.documents_created / parseInt(days)).toFixed(1)
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Signatur-Abschlussquote</p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {analytics?.signatureStats?.total > 0
                    ? ((analytics.signatureStats.completed / analytics.signatureStats.total) * 100).toFixed(0)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Top Template</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {analytics?.templateUsage?.[0]?.count || 0}x genutzt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}