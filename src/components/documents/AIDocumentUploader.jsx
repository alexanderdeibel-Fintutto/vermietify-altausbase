import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Sparkles, FileText, CheckCircle } from 'lucide-react';

export default function AIDocumentUploader({ companyId, buildingId, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (fileUrl) => {
      const response = await base44.functions.invoke('aiDocumentAnalysis', {
        action: 'categorize_and_extract',
        document_url: fileUrl
      });
      return response.data.analysis;
    },
    onSuccess: (data) => setAnalysis(data)
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Document.create({
        name: file.name,
        company_id: companyId,
        building_id: buildingId,
        document_type: analysis.category,
        file_url: analysis.file_url,
        metadata: {
          ai_extracted: analysis.extracted_data,
          ai_summary: analysis.summary,
          ai_confidence: analysis.confidence
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setFile(null);
      setAnalysis(null);
      if (onUploadComplete) onUploadComplete();
    }
  });

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setUploading(true);
    
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const fileUrl = uploadResult.file_url;
      
      analysis.file_url = fileUrl;
      await analyzeMutation.mutateAsync(fileUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Dokument-Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            id="ai-doc-upload"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.png"
          />
          <Button
            onClick={() => document.getElementById('ai-doc-upload').click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Lade hoch...' : 'Dokument hochladen'}
          </Button>
        </div>

        {file && !analysis && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-900">{file.name}</span>
          </div>
        )}

        {analysis && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Analyse abgeschlossen
                </p>
                <Badge className="bg-green-600 text-white">
                  {analysis.confidence}% Konfidenz
                </Badge>
              </div>
              <p className="text-xs text-green-700 mb-2"><strong>Kategorie:</strong> {analysis.category}</p>
              <p className="text-xs text-green-700">{analysis.summary}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs font-medium mb-2">Extrahierte Daten:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {analysis.extracted_data.dates?.length > 0 && (
                  <div>
                    <span className="text-slate-600">Daten:</span>
                    <p className="font-medium">{analysis.extracted_data.dates.join(', ')}</p>
                  </div>
                )}
                {analysis.extracted_data.amounts?.length > 0 && (
                  <div>
                    <span className="text-slate-600">Beträge:</span>
                    <p className="font-medium">{analysis.extracted_data.amounts.join(', ')}</p>
                  </div>
                )}
                {analysis.extracted_data.names?.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-slate-600">Namen:</span>
                    <p className="font-medium">{analysis.extracted_data.names.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              Dokument speichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}