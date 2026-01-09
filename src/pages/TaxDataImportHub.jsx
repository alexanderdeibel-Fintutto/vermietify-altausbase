import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Database, Zap } from 'lucide-react';

export default function TaxDataImportHub() {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleFinAPISync = async () => {
    setSyncing(true);
    const response = await base44.functions.invoke('finapiSyncAssets');
    setSyncStatus(response.data);
    setSyncing(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    // Weitere Verarbeitung mit extrahierter Daten
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📥 Steuerdaten-Import</h1>
        <p className="text-slate-500 mt-1">Importieren Sie Daten von Banken, Brokern und anderen Quellen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              FinAPI Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Verbinden Sie sich mit FinAPI, um Konten zu synchronisieren</p>
            <Button
              onClick={handleFinAPISync}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={syncing}
            >
              <Zap className="w-4 h-4 mr-2" />
              {syncing ? 'Wird synchronisiert...' : 'Synchronisieren'}
            </Button>
            {syncStatus && (
              <div className="text-xs p-2 bg-green-50 rounded">
                ✓ {syncStatus.synced_accounts} Konten synchronisiert
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" />
              CSV Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Laden Sie eine CSV-Datei mit Transaktionsdaten hoch</p>
            <label className="w-full">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center cursor-pointer hover:bg-slate-50">
                <p className="text-sm text-slate-600">CSV-Datei auswählen oder hierher ziehen</p>
              </div>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}