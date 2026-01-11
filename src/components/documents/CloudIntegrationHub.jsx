import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Loader2 } from 'lucide-react';

export default function CloudIntegrationHub({ companyId }) {
  const [dropboxPath, setDropboxPath] = useState('');
  const [sharepointSite, setSharepointSite] = useState('');
  const queryClient = useQueryClient();

  const dropboxMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('dropboxDocumentSync', {
        company_id: companyId,
        folder_path: dropboxPath
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
  });

  const sharepointMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('sharepointDocumentSync', {
        company_id: companyId,
        site_id: sharepointSite
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Cloud-Integrationen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dropbox">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
            <TabsTrigger value="sharepoint">SharePoint</TabsTrigger>
          </TabsList>

          <TabsContent value="dropbox" className="space-y-3">
            <Input
              placeholder="Folder Path (leer für Root)"
              value={dropboxPath}
              onChange={(e) => setDropboxPath(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={() => dropboxMutation.mutate()}
              disabled={dropboxMutation.isPending}
              className="w-full gap-2"
            >
              {dropboxMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Von Dropbox importieren
            </Button>
            {dropboxMutation.isSuccess && (
              <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                ✓ {dropboxMutation.data?.data?.imported} Dateien importiert
              </div>
            )}
          </TabsContent>

          <TabsContent value="sharepoint" className="space-y-3">
            <Input
              placeholder="SharePoint Site ID"
              value={sharepointSite}
              onChange={(e) => setSharepointSite(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={() => sharepointMutation.mutate()}
              disabled={!sharepointSite || sharepointMutation.isPending}
              className="w-full gap-2"
            >
              {sharepointMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Von SharePoint importieren
            </Button>
            {sharepointMutation.isSuccess && (
              <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                ✓ {sharepointMutation.data?.data?.imported} Dateien importiert
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}