import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Save } from 'lucide-react';
import ReactQuill from 'react-quill';
import { toast } from 'sonner';

export default function CollaborativeDocumentEditor({ documentId }) {
  const [content, setContent] = useState('');

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveCollaborativeDocument', { document_id: documentId, content });
    },
    onSuccess: () => {
      toast.success('Dokument gespeichert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gemeinsame Bearbeitung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className="bg-green-600">2 aktive Bearbeiter</Badge>
        <ReactQuill value={content} onChange={setContent} />
        <Button onClick={() => saveMutation.mutate()} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </CardContent>
    </Card>
  );
}