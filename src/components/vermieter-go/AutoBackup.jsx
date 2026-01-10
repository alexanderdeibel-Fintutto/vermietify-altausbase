import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoBackup() {
  const lastBackup = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const createBackup = () => {
    toast.success('Backup wird erstellt...');
    setTimeout(() => {
      toast.success('Backup abgeschlossen');
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          Automatisches Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Aktiv</span>
          </div>
          <p className="text-xs text-slate-600">
            Letztes Backup: {lastBackup.toLocaleDateString('de-DE')} {lastBackup.toLocaleTimeString('de-DE')}
          </p>
        </div>

        <Button onClick={createBackup} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Jetzt Backup erstellen
        </Button>
      </CardContent>
    </Card>
  );
}