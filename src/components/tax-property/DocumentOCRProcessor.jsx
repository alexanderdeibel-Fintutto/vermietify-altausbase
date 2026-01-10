import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Scan, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentOCRProcessor({ documentId, documentUrl }) {
  const queryClient = useQueryClient();

  const ocrMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Extrahiere den gesamten Text aus diesem Dokument. Erkenne auch Tabellen, Beträge und Datumsangaben. Strukturiere die Ausgabe sinnvoll.',
        file_urls: [documentUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            full_text: { type: 'string' },
            key_data: {
              type: 'object',
              properties: {
                dates: { type: 'array', items: { type: 'string' } },
                amounts: { type: 'array', items: { type: 'number' } },
                entities: { type: 'array', items: { type: 'string' } }
              }
            },
            document_type: { type: 'string' }
          }
        }
      });

      return await base44.entities.Document.update(documentId, {
        content: result.full_text,
        ai_summary: `${result.document_type} - ${result.key_data.entities?.join(', ') || 'Keine Entitäten'}`,
        ai_processed: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success('OCR-Texterkennung abgeschlossen');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5" />
          OCR-Texterkennung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => ocrMutation.mutate()}
          disabled={ocrMutation.isPending}
          className="w-full bg-purple-600"
        >
          <Scan className="w-4 h-4 mr-2" />
          {ocrMutation.isPending ? 'Erkenne Text...' : 'Text extrahieren'}
        </Button>
      </CardContent>
    </Card>
  );
}