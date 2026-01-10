import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentComments({ documentId }) {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', documentId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDocumentComments', { document_id: documentId });
      return response.data.comments;
    },
    enabled: !!documentId
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('addDocumentComment', { document_id: documentId, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', documentId] });
      toast.success('Kommentar hinzugefügt');
      setComment('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Kommentare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.map((c, idx) => (
          <div key={idx} className="p-2 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold">{c.author}</p>
            <p className="text-xs text-slate-600">{c.text}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(c.created_at).toLocaleString('de-DE')}</p>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            placeholder="Kommentar schreiben..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button size="icon" onClick={() => addMutation.mutate()} disabled={!comment}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}