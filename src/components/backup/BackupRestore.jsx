import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Database, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupRestore() {
  const { data: backups = [] } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getBackups', {});
      return response.data.backups;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('createBackup', {});
    },
    onSuccess: () => {
      toast.success('Backup erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Backup & Restore
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => createMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Neues Backup erstellen
        </Button>
        {backups.map(backup => (
          <div key={backup.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold">{new Date(backup.created_at).toLocaleString('de-DE')}</p>
              <Badge className="text-xs">{backup.size}</Badge>
            </div>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}