import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import DocumentTrendsChart from '@/components/documents/DocumentTrendsChart';
import DocumentTypeChart from '@/components/documents/DocumentTypeChart';
import ArchivingChart from '@/components/documents/ArchivingChart';
import TaskCompletionChart from '@/components/documents/TaskCompletionChart';
import SignatureStatusChart from '@/components/documents/SignatureStatusChart';

export default function DocumentManagementDashboard() {
  const [companyId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('company_id') || 'all';
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['document-metrics', companyId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDocumentMetrics', {
        company_id: companyId,
        days: 90
      });
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Dokumentenverwaltung Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = metrics?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dokumentenverwaltung Dashboard</h1>
        <p className="text-slate-600 mt-1">Übersicht der wichtigsten Metriken</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Gesamtdokumente</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalDocuments || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Archiviert</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalArchived || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Aufgaben</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalTasks || 0}</p>
            {stats.overdueTasks > 0 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {stats.overdueTasks} überfällig
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Signaturanfragen</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalSignatureRequests || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Abschlussrate</p>
            <p className="text-3xl font-bold text-slate-900">{stats.completionRate || 0}%</p>
            <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
              Aufgaben
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentTrendsChart data={metrics?.trendData} />
        <DocumentTypeChart data={metrics?.typeData} />
        <ArchivingChart data={metrics?.archiveData} />
        <TaskCompletionChart data={metrics?.taskCompletion} />
      </div>

      {/* Signature Status */}
      <div>
        <SignatureStatusChart data={metrics?.signatureStatus} />
      </div>
    </div>
  );
}