import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Download, Trash2, Lock, AlertTriangle } from 'lucide-react';

export default function ComplianceCenter({ userId }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: auditLog = [] } = useQuery({
    queryKey: ['auditLog', userId],
    queryFn: async () => base44.entities.ActivityLog.filter({ user_id: userId }, '-created_date', 100) || []
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const portfolio = await base44.entities.AssetPortfolio.filter({ user_id: userId });
      const priceHistory = await base44.entities.PriceHistory.filter({ asset_portfolio_id: { $in: portfolio.map(p => p.id) } });
      const alerts = await base44.entities.PortfolioAlert.filter({ user_id: userId });
      
      const data = { portfolio, priceHistory, alerts, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('gdprDeleteAllData', { userId });
    },
    onSuccess: () => {
      setDeleteConfirm(false);
      alert('Alle Daten wurden gelöscht');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            GDPR Compliance Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Ihre Datenschutzrechte</AlertTitle>
            <AlertDescription>
              Sie haben das Recht auf Dateneinsicht, Datenportabilität und Löschung gemäß DSGVO Art. 15-17.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Data Export */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Datenexport (Portabilität)</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Laden Sie alle Ihre Daten im JSON-Format herunter - vollständig und maschinenlesbar.
                </p>
                <Button 
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exportDataMutation.isPending ? 'Wird exportiert...' : 'Daten exportieren'}
                </Button>
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <h3 className="font-medium">Datenlöschung (Recht vergessen zu werden)</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Löschen Sie permanent alle Ihre Vermögensdaten und verwandten Informationen.
                </p>
                {deleteConfirm ? (
                  <Alert className="border-red-300 bg-red-100">
                    <AlertTitle>Bitte bestätigen</AlertTitle>
                    <AlertDescription>Dies kann nicht rückgängig gemacht werden.</AlertDescription>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(false)}>Abbrechen</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteAllDataMutation.mutate()}>
                        Definitiv löschen
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <Button onClick={() => setDeleteConfirm(true)} variant="destructive" className="w-full gap-2">
                    <Trash2 className="w-4 h-4" />
                    Alle Daten löschen
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Audit Trail (Transparenz)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLog.map(log => (
              <div key={log.id} className="text-xs p-2 bg-slate-50 rounded border flex justify-between">
                <span className="text-slate-600">{log.action}</span>
                <span className="text-slate-400">{new Date(log.created_date).toLocaleDateString('de-DE')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}