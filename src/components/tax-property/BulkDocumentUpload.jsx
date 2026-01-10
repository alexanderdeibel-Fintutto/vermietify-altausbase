import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkDocumentUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const uploadMutation = useMutation({
    mutationFn: async (fileList) => {
      setUploading(true);
      const results = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setProgress(((i + 1) / fileList.length) * 100);

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: 'Analysiere kurz: Dokumenttyp, Kategorie (Mietrecht/Verwaltung/Finanzen/Sonstiges), Datum wenn erkennbar',
          file_urls: [file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              summary: { type: 'string' },
              date: { type: 'string' }
            }
          }
        });

        await base44.entities.Document.create({
          name: file.name,
          file_url,
          category: analysis.category || 'Sonstiges',
          status: 'gescannt',
          ai_summary: analysis.summary,
          ai_processed: true,
          file_type: file.type.includes('image') ? 'image' : 'pdf',
          file_size: file.size
        });

        results.push({ name: file.name, success: true });
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`${results.length} Dokumente hochgeladen`);
      setFiles([]);
      setUploading(false);
      setProgress(0);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk-Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="bulk-upload"
        />
        
        <label htmlFor="bulk-upload">
          <Button asChild variant="outline" className="w-full h-16">
            <span>
              <Upload className="w-5 h-5 mr-2" />
              Mehrere Dateien auswählen
            </span>
          </Button>
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold">{files.length} Dateien ausgewählt</p>
              <Button size="sm" variant="ghost" onClick={() => setFiles([])}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {uploading && (
              <div>
                <Progress value={progress} />
                <p className="text-xs text-slate-600 mt-1">{Math.round(progress)}%</p>
              </div>
            )}

            <Button
              onClick={() => uploadMutation.mutate(files)}
              disabled={uploading}
              className="w-full bg-blue-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              {uploading ? 'Lade hoch...' : 'Alle hochladen & analysieren'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}