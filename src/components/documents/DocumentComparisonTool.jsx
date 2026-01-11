import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { GitCompare, Loader2 } from 'lucide-react';

export default function DocumentComparisonTool({ companyId }) {
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: async () => {
      const docs = await base44.asServiceRole.entities.Document.filter({ company_id: companyId });
      return docs.slice(0, 50);
    }
  });

  const compareMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('documentComparison', {
        document_id_1: doc1Id,
        document_id_2: doc2Id
      })
  });

  const result = compareMutation.data?.data?.comparison;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-4 h-4" />
          Dokumente vergleichen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Dokument 1</label>
          <Select value={doc1Id} onValueChange={setDoc1Id}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Wähle Dokument 1" />
            </SelectTrigger>
            <SelectContent>
              {documents.map(doc => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Dokument 2</label>
          <Select value={doc2Id} onValueChange={setDoc2Id}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Wähle Dokument 2" />
            </SelectTrigger>
            <SelectContent>
              {documents.map(doc => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => compareMutation.mutate()}
          disabled={!doc1Id || !doc2Id || compareMutation.isPending}
          className="w-full gap-2"
        >
          {compareMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Vergleichen
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ähnlichkeit</span>
              <Badge variant={result.similarity_score > 0.7 ? 'default' : 'outline'}>
                {(result.similarity_score * 100).toFixed(0)}%
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Zusammenfassung</p>
              <p className="text-xs text-slate-700">{result.summary}</p>
            </div>

            {result.differences && result.differences.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Unterschiede</p>
                <div className="space-y-1">
                  {result.differences.map((diff, i) => (
                    <p key={i} className="text-xs text-slate-700 flex items-start gap-1">
                      <span>•</span>
                      <span>{diff}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}