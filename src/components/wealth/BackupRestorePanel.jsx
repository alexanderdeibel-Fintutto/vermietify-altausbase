import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Upload, CheckCircle2 } from 'lucide-react';

export default function BackupRestorePanel({ userId }) {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef(null);

  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('backupPortfolioData');
      const blob = new Blob([JSON.stringify(response.data.backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  });

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const backup = JSON.parse(content);

      for (const item of backup.data.portfolio) {
        delete item.id;
        delete item.created_date;
        delete item.updated_date;
        delete item.created_by;
        await base44.entities.AssetPortfolio.create({ ...item, user_id: userId });
      }

      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
      alert('Portfolio erfolgreich wiederhergestellt!');
    } catch (error) {
      alert('Fehler beim Wiederherstellen: ' + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Wiederherstellen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Download className="w-4 h-4 text-green-600" />
                Backup erstellen
              </h3>
              <p className="text-sm text-slate-600">Sichern Sie Ihr Portfolio lokal</p>
              <Button 
                onClick={() => backupMutation.mutate()} 
                disabled={backupMutation.isPending}
                className="w-full"
              >
                {backupMutation.isPending ? 'Wird erstellt...' : 'Backup herunterladen'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Portfolio wiederherstellen
              </h3>
              <p className="text-sm text-slate-600">Laden Sie ein Backup-File hoch</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json"
                onChange={handleRestore}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                Datei hochladen
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}