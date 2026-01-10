import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Database, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupRestore() {
  const queryClient = useQueryClient();

  const { data: backups = [] } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getBackups', {});
      return response.data.backups;
    }
  });

  const backupMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('createBackup', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success('Backup erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Backup & Wiederherstellung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => backupMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Jetzt Backup erstellen
        </Button>
        <div className="space-y-2">
          {backups.map(backup => (
            <div key={backup.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <div>
                <p className="text-sm font-semibold">{new Date(backup.created_date).toLocaleString('de-DE')}</p>
                <Badge variant="outline">{backup.size}</Badge>
              </div>
              <Button size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-1" />
                Wiederherstellen
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}