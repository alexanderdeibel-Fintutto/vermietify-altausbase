import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileStack, Loader2 } from 'lucide-react';

export default function DocumentAssembly({ companyId }) {
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [outputName, setOutputName] = useState('');
  const [operation, setOperation] = useState('merge');
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: async () => {
      const docs = await base44.asServiceRole.entities.Document.filter({ company_id: companyId });
      return docs.slice(0, 30);
    }
  });

  const assembleMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('assembleDocuments', {
        company_id: companyId,
        document_ids: selectedDocs,
        output_name: outputName,
        operation
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocs([]);
      setOutputName('');
    }
  });

  const toggleDoc = (id) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileStack className="w-4 h-4" />
          Dokument-Assembly
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Operation</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-full mt-1 p-2 border rounded text-sm"
          >
            <option value="merge">Zusammenführen</option>
            <option value="template_fill">Template ausfüllen</option>
          </select>
        </div>

        <Input
          placeholder="Output-Name"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="text-sm"
        />

        <Badge>{selectedDocs.length} ausgewählt</Badge>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {documents.map(doc => (
            <label
              key={doc.id}
              className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer"
            >
              <Checkbox
                checked={selectedDocs.includes(doc.id)}
                onCheckedChange={() => toggleDoc(doc.id)}
              />
              <span className="text-sm">{doc.name}</span>
            </label>
          ))}
        </div>

        <Button
          onClick={() => assembleMutation.mutate()}
          disabled={selectedDocs.length < 2 || !outputName || assembleMutation.isPending}
          className="w-full gap-2"
        >
          {assembleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Zusammenführen
        </Button>
      </CardContent>
    </Card>
  );
}