import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import SyncJobManager from '@/components/sync/SyncJobManager';

export default function SyncManagement() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['syncStats'],
    queryFn: async () => {
      try {
        const jobs = await base44.entities.SyncJob.list();
        const logs = await base44.entities.SyncAuditLog.list('-started_at', 100);

        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(j => j.is_active).length;
        const successfulSyncs = logs.filter(l => l.status === 'success').length;
        const failedSyncs = logs.filter(l => l.status === 'failed').length;
        const totalTransactionsSynced = logs.reduce((sum, l) => sum + (l.transactions_synced || 0), 0);

        return {
          totalJobs,
          activeJobs,
          successfulSyncs,
          failedSyncs,
          totalTransactionsSynced
        };
      } catch {
        return null;
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light">Synchronisierungsverwaltung</h1>
        <p className="text-slate-600 text-sm mt-1">
          Automatisierte Synchronisierung von Finanzdaten mit Fehlerhandling und Audit-Log
        </p>
      </div>

      {/* Stats */}
      {!isLoading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-xs text-blue-700 font-semibold">Aktive Jobs</p>
              <p className="text-2xl font-bold text-blue-900">{stats.activeJobs}/{stats.totalJobs}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <p className="text-xs text-green-700 font-semibold">Erfolgreiche Syncs</p>
              <p className="text-2xl font-bold text-green-900">{stats.successfulSyncs}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <p className="text-xs text-red-700 font-semibold">Fehler</p>
              <p className="text-2xl font-bold text-red-900">{stats.failedSyncs}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4">
              <p className="text-xs text-purple-700 font-semibold">Transaktionen</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalTransactionsSynced.toLocaleString('de-DE')}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-600 font-semibold">Erfolgsquote</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.successfulSyncs + stats.failedSyncs > 0
                  ? Math.round((stats.successfulSyncs / (stats.successfulSyncs + stats.failedSyncs)) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Manager */}
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs">Jobs & Aktivitäten</TabsTrigger>
          <TabsTrigger value="info">Informationen</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <SyncJobManager />
        </TabsContent>

        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wie funktioniert die Synchronisierung?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-3">
              <p>
                <span className="font-semibold">Automatisierte Jobs:</span> Definieren Sie regelmäßige Synchronisierungsjobs für Bankkonten und Kryptowerte.
              </p>
              <p>
                <span className="font-semibold">Fehlerbehandlung:</span> Bei Fehlern wird automatisch erneut versucht (konfigurierbar).
              </p>
              <p>
                <span className="font-semibold">Benachrichtigungen:</span> Erhalten Sie E-Mail-Benachrichtigungen bei Synchronisierungsfehlern.
              </p>
              <p>
                <span className="font-semibold">Audit-Log:</span> Alle Synchronisierungsaktivitäten werden detailliert protokolliert.
              </p>
              <p>
                <span className="font-semibold">Datenqualität:</span> Duplikaterkennung und automatische Bereinigung.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fehlerbehebung</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2">
              <div>
                <p className="font-semibold">Wiederholte Fehler?</p>
                <p className="text-slate-600">Überprüfen Sie Ihre Bankdaten und Krypto-Wallet-Adressen in den Einstellungen.</p>
              </div>
              <div>
                <p className="font-semibold">Keine Transaktionen synchronisiert?</p>
                <p className="text-slate-600">Stellen Sie sicher, dass die FinAPI-Integration konfiguriert ist.</p>
              </div>
              <div>
                <p className="font-semibold">Timeout-Fehler?</p>
                <p className="text-slate-600">Der Sync dauert länger als erwartet. Versuchen Sie es später erneut.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}