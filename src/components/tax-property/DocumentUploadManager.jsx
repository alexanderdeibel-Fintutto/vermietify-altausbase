import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Image, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentUploadManager() {
  const [category, setCategory] = useState('Sonstiges');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['recentDocs'],
    queryFn: () => base44.entities.Document.list('-created_date', 10)
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysiere dieses Dokument und extrahiere: Dokumenttyp, relevante Daten, steuerliche Kategorie',
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            doc_type: { type: 'string' },
            summary: { type: 'string' },
            tax_category: { type: 'string' }
          }
        }
      });

      return await base44.entities.Document.create({
        name: file.name,
        file_url,
        category: category,
        status: 'gescannt',
        ai_summary: analysis.summary,
        ai_category: analysis.tax_category,
        ai_processed: true,
        file_type: file.type.includes('image') ? 'image' : 'pdf',
        file_size: file.size
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentDocs'] });
      toast.success('Dokument hochgeladen & analysiert');
      setUploading(false);
    }
  });

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) uploadMutation.mutate(file);
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Dokumente hochladen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Mietrecht">Mietrecht</SelectItem>
            <SelectItem value="Verwaltung">Verwaltung</SelectItem>
            <SelectItem value="Finanzen">Finanzen</SelectItem>
            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8" />
            <span className="font-semibold">{uploading ? 'Lade hoch & analysiere...' : 'Foto/PDF hochladen'}</span>
          </div>
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Zuletzt hochgeladen:</p>
          {documents.slice(0, 3).map(doc => (
            <div key={doc.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
              {doc.file_type === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span className="text-sm flex-1">{doc.name?.slice(0, 30)}</span>
              {doc.ai_processed && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}