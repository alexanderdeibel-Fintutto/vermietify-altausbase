import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, Loader2, CheckCircle, AlertCircle, 
  Settings, Calendar, Database, TrendingUp 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";

export default function AutomatedFinancialSync() {
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    setSyncing(true);
    setProgress(0);

    try {
      const progressUpdates = [
        { step: 'Lade Finanzdaten...', progress: 20 },
        { step: 'Analysiere Buchungen...', progress: 40 },
        { step: 'Kategorisiere Ausgaben...', progress: 60 },
        { step: 'Synchronisiere mit ELSTER...', progress: 80 },
        { step: 'Finalisiere...', progress: 100 }
      ];

      for (const update of progressUpdates) {
        setProgress(update.progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const response = await base44.functions.invoke('automatedFinancialSync', {
        year: new Date().getFullYear()
      });

      setSyncStats(response.data);
      setLastSync(new Date());
      toast.success('Finanzdaten erfolgreich synchronisiert');
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const toggleAutoSync = async (enabled) => {
    setAutoSync(enabled);
    
    try {
      await base44.functions.invoke('configureAutoSync', {
        enabled,
        schedule: 'daily' // täglich um 2 Uhr nachts
      });
      
      toast.success(
        enabled 
          ? 'Automatische Synchronisation aktiviert (täglich 2:00 Uhr)' 
          : 'Automatische Synchronisation deaktiviert'
      );
    } catch (error) {
      toast.error('Konfiguration fehlgeschlagen');
      setAutoSync(!enabled);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Automatisierte Finanzdaten-Synchronisation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-sync" className="text-sm">Auto-Sync</Label>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={toggleAutoSync}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Letzte Synchronisation:</span>
            </div>
            <span className="text-sm font-medium">
              {lastSync.toLocaleString('de-DE')}
            </span>
          </div>
        )}

        {syncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Synchronisiere Daten...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {syncStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-600 mb-1">Einnahmen</div>
              <div className="text-lg font-bold text-blue-700">
                {syncStats.income_items || 0}
              </div>
              <div className="text-xs text-blue-600">
                {syncStats.income_total?.toLocaleString('de-DE', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-xs text-red-600 mb-1">Ausgaben</div>
              <div className="text-lg font-bold text-red-700">
                {syncStats.expense_items || 0}
              </div>
              <div className="text-xs text-red-600">
                {syncStats.expense_total?.toLocaleString('de-DE', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Kategorisiert</div>
              <div className="text-lg font-bold text-green-700">
                {syncStats.categorized || 0}
              </div>
              <div className="text-xs text-green-600">
                {syncStats.categorized_percent?.toFixed(1)}%
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-xs text-yellow-600 mb-1">Prüfung nötig</div>
              <div className="text-lg font-bold text-yellow-700">
                {syncStats.needs_review || 0}
              </div>
              <div className="text-xs text-yellow-600">
                Manuelle Prüfung
              </div>
            </div>
          </div>
        )}

        {syncStats?.mappings && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Sync-Zuordnungen:</div>
            <div className="space-y-1">
              {Object.entries(syncStats.mappings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">{key}</span>
                  <Badge variant="outline">{value} Positionen</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Jetzt synchronisieren
          </Button>
          
          <Button variant="outline" className="flex-1">
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </Button>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <strong>Automatisierte Sync:</strong> Bei aktiviertem Auto-Sync werden täglich um 2:00 Uhr
              automatisch alle Finanzdaten mit den ELSTER-Formularen synchronisiert. Dies umfasst:
              Mieteinnahmen, Betriebskosten, Instandhaltung, AfA-Berechnung, und mehr.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}