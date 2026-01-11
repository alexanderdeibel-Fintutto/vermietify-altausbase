import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Cloud } from 'lucide-react';

export default function GoogleDriveSyncPanel({ companyId }) {
  const [folderId, setFolderId] = useState('');
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('googleDriveDocumentSync', {
        company_id: companyId,
        folder_id: folderId
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Google Drive Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium">Folder ID</label>
          <Input
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            placeholder="Google Drive Folder ID"
            className="mt-1 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            Folder-ID aus der Google Drive URL kopieren
          </p>
        </div>

        <Button
          onClick={() => syncMutation.mutate()}
          disabled={!folderId || syncMutation.isPending}
          className="w-full gap-2"
        >
          {syncMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Dateien importieren
        </Button>

        {syncMutation.isSuccess && (
          <div className="bg-green-50 p-3 rounded text-sm text-green-700">
            ✓ {syncMutation.data?.data?.imported} Dokumente importiert
          </div>
        )}
      </CardContent>
    </Card>
  );
}