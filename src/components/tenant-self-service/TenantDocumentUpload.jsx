import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantDocumentUpload() {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.functions.invoke('saveTenantDocument', { file_url, name: file.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantDocuments'] });
      toast.success('Dokument hochgeladen');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Dokumente hochladen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
          className="hidden"
          id="tenant-upload"
        />
        <label htmlFor="tenant-upload">
          <Button asChild className="w-full">
            <span>Dokument hochladen</span>
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}