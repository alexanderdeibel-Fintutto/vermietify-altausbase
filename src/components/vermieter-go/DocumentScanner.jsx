import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentScanner({ buildingId }) {
  const [scanning, setScanning] = useState(false);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (file) => {
      setScanning(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // AI extract document data
      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysiere dieses Dokument und extrahiere: Dokumenttyp, wichtige Daten, Beträge, Namen. Gib eine Zusammenfassung.',
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            document_type: { type: 'string' },
            summary: { type: 'string' },
            key_data: { type: 'object' }
          }
        }
      });

      return await base44.entities.Document.create({
        name: aiResult.document_type || 'Gescanntes Dokument',
        file_url,
        category: 'Verwaltung',
        status: 'gescannt',
        building_id: buildingId,
        ai_summary: aiResult.summary,
        ai_processed: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument gescannt und gespeichert');
      setScanning(false);
    }
  });

  const handleScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) scanMutation.mutate(file);
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Dokumenten-Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleScan} disabled={scanning} className="w-full h-24 bg-indigo-600">
          <div className="flex flex-col items-center gap-2">
            {scanning ? <Upload className="w-8 h-8 animate-pulse" /> : <Camera className="w-8 h-8" />}
            <span className="font-semibold">{scanning ? 'Scanne...' : 'Dokument scannen'}</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}