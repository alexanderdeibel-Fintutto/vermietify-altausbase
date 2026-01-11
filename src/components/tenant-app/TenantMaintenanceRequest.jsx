import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, Upload, Camera } from 'lucide-react';

export default function TenantMaintenanceRequest({ tenantId, unitId, companyId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (fileUrl) => {
      setUploadedFiles([...uploadedFiles, fileUrl]);
    }
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      base44.entities.MaintenanceTask.create({
        tenant_id: tenantId,
        unit_id: unitId,
        company_id: companyId,
        title,
        description,
        priority: 'medium',
        status: 'open',
        attachments: uploadedFiles,
        task_type: 'repair'
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setUploadedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Wartung / Reparatur melden
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Problem (z.B. 'Heizung defekt')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Detaillierte Beschreibung..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <div>
          <label className="block text-sm mb-2">Fotos/Videos hochladen:</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('photo-upload').click()}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Foto
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload').click()}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Datei
            </Button>
          </div>
          <input
            id="photo-upload"
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploadedFiles.length > 0 && (
            <p className="text-xs text-green-600 mt-2">
              {uploadedFiles.length} Datei(en) hochgeladen
            </p>
          )}
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={!title || submitMutation.isPending}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          Anfrage absenden
        </Button>
      </CardContent>
    </Card>
  );
}