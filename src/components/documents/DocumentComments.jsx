import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentComments({ documentId, companyId }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', documentId],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageDocumentComments', {
        action: 'list',
        document_id: documentId
      });
      return result.data.comments || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: () => {
      const mentions = newComment.match(/@(\S+)/g)?.map(m => m.substring(1)) || [];
      return base44.functions.invoke('manageDocumentComments', {
        action: 'create',
        document_id: documentId,
        company_id: companyId,
        content: newComment,
        mentions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment('');
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (commentId) =>
      base44.functions.invoke('manageDocumentComments', {
        action: 'resolve',
        comment_id: commentId
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Kommentare ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="Kommentar schreiben... (Verwende @ für Erwähnungen)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="h-20 text-sm"
          />
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!newComment || addMutation.isPending}
            size="sm"
            className="gap-2"
          >
            <Send className="w-3 h-3" />
            Senden
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="p-3 bg-slate-50 rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-medium">{comment.author_name}</p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(comment.created_date), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
                {!comment.resolved && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveMutation.mutate(comment.id)}
                    title="Als gelöst markieren"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-700">{comment.content}</p>
              {comment.mentions && comment.mentions.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {comment.mentions.map(m => (
                    <Badge key={m} variant="secondary" className="text-xs">@{m}</Badge>
                  ))}
                </div>
              )}
              {comment.resolved && (
                <Badge variant="outline" className="mt-2 text-xs">Gelöst</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}