import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Database, Copy } from 'lucide-react';

export default function AIDataExtractor({ companyId }) {
  const [selectedDocId, setSelectedDocId] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: () => base44.entities.Document.filter({ company_id: companyId })
  });

  const extractMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiDocumentAnalysis', {
        action: 'extract_field_values',
        document_id: selectedDocId
      }),
    onSuccess: (response) => setExtractedData(response.data.extracted_fields)
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-5 h-5 text-purple-600" />
          KI-Datenextraktion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedDocId} onValueChange={setSelectedDocId}>
          <SelectTrigger>
            <SelectValue placeholder="Dokument auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {documents.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => extractMutation.mutate()}
          disabled={!selectedDocId || extractMutation.isPending}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Daten extrahieren
        </Button>

        {extractedData && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">Extrahierte Felder:</p>
            {Object.entries(extractedData).map(([key, value]) => {
              if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
              
              const displayValue = typeof value === 'object' 
                ? JSON.stringify(value, null, 2)
                : value;
              
              return (
                <div key={key} className="p-2 bg-slate-50 border rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(displayValue)}
                      className="h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{displayValue}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}