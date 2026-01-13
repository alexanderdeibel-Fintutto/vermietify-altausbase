import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function GoogleDriveSync() {
  const [autoSync, setAutoSync] = useState(true);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['google-drive-config'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getGoogleDriveConfig', {});
      return response.data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncWithGoogleDrive', {
        entityTypes: ['Invoice', 'Contract', 'Document'],
        autoSync: autoSync
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success(`✅ ${result.synced} Dateien synchronisiert`);
      queryClient.invalidateQueries(['google-drive-config']);
    }
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      // Trigger OAuth flow
      window.location.href = '/api/auth/google-drive';
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔗 Google Drive Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {config?.connected ? (
          <>
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-sm text-emerald-800">
                ✅ Mit Google Drive verbunden ({config.email})
              </AlertDescription>
            </Alert>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
              <span className="text-sm">Automatische Synchronisierung aktivieren</span>
            </label>

            {autoSync && (
              <p className="text-xs text-slate-500">
                Neue Rechnungen und Verträge werden automatisch zu Google Drive synchronisiert
              </p>
            )}

            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="w-full gap-2"
            >
              <RotateCw className="w-4 h-4" />
              {syncMutation.isPending ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </Button>
          </>
        ) : (
          <>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                Verbinden Sie Google Drive, um Dokumente automatisch zu synchronisieren
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="w-full"
            >
              Google Drive verbinden
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}