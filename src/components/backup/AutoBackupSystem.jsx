import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Download, Clock, CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AutoBackupSystem() {
  const queryClient = useQueryClient();
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch user preferences for backup settings
  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences', user?.email],
    queryFn: () => base44.entities.UserPreferences.filter({ user_email: user?.email }),
    enabled: !!user
  });

  // Initialize from saved preferences
  React.useEffect(() => {
    if (userPreferences?.[0]) {
      const prefs = userPreferences[0];
      setAutoBackupEnabled(prefs.auto_backup_enabled || false);
      setBackupFrequency(prefs.backup_frequency || 'daily');
    }
  }, [userPreferences]);

  const savePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (userPreferences?.[0]) {
        return base44.entities.UserPreferences.update(userPreferences[0].id, data);
      } else {
        return base44.entities.UserPreferences.create({
          user_email: user?.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Einstellungen gespeichert');
    }
  });

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      // Fetch all critical entities
      const [buildings, units, contracts, tenants, invoices, costTypes] = await Promise.all([
        base44.entities.Building.list(),
        base44.entities.Unit.list(),
        base44.entities.LeaseContract.list(),
        base44.entities.Tenant.list(),
        base44.entities.Invoice.list(),
        base44.entities.CostType.list()
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        user_email: user?.email,
        data: {
          buildings,
          units,
          contracts,
          tenants,
          invoices,
          costTypes
        }
      };

      // Create downloadable backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finx_backup_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      // Also save backup metadata to database
      await base44.entities.UserPreferences.create({
        user_email: user?.email,
        last_backup_date: new Date().toISOString(),
        backup_size_kb: Math.round(blob.size / 1024)
      });

      toast.success('Backup erstellt und heruntergeladen');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Fehler beim Erstellen des Backups');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleToggleAutoBackup = async (enabled) => {
    setAutoBackupEnabled(enabled);
    await savePreferencesMutation.mutateAsync({
      auto_backup_enabled: enabled,
      backup_frequency: backupFrequency
    });
  };

  const handleFrequencyChange = async (frequency) => {
    setBackupFrequency(frequency);
    await savePreferencesMutation.mutateAsync({
      auto_backup_enabled: autoBackupEnabled,
      backup_frequency: frequency
    });
  };

  const lastBackup = userPreferences?.[0]?.last_backup_date;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Automatisches Backup-System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Backup */}
          <div>
            <h3 className="font-semibold mb-3">Manuelles Backup</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Jetzt Backup erstellen</p>
                <p className="text-xs text-slate-600 mt-1">
                  Exportiert alle Ihre Daten als JSON-Datei
                </p>
                {lastBackup && (
                  <p className="text-xs text-slate-500 mt-1">
                    Letztes Backup: {format(new Date(lastBackup), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                )}
              </div>
              <Button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="gap-2"
              >
                {creatingBackup ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Backup erstellen
              </Button>
            </div>
          </div>

          {/* Auto Backup Settings */}
          <div>
            <h3 className="font-semibold mb-3">Automatische Backups</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-backup">Automatische Backups aktivieren</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Regelmäßige Backups Ihrer Daten
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={autoBackupEnabled}
                  onCheckedChange={handleToggleAutoBackup}
                />
              </div>

              {autoBackupEnabled && (
                <div>
                  <Label>Backup-Häufigkeit</Label>
                  <Select value={backupFrequency} onValueChange={handleFrequencyChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {autoBackupEnabled && (
                <Alert className="border-blue-500 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Automatische Backups werden {backupFrequency === 'daily' ? 'täglich um 3:00 Uhr' : backupFrequency === 'weekly' ? 'jeden Sonntag um 3:00 Uhr' : 'am 1. jeden Monats um 3:00 Uhr'} erstellt und per E-Mail versendet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Wichtige Hinweise:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Backups enthalten alle Gebäude, Verträge, Rechnungen und Stammdaten</li>
                <li>• Backup-Dateien sind JSON-formatiert und menschenlesbar</li>
                <li>• Für Wiederherstellung kontaktieren Sie den Support</li>
                <li>• Backups werden lokal heruntergeladen (nicht auf Server gespeichert)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}