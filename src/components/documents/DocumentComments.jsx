import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MessageCircle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentComments({ documentId }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['document-comments', documentId],
    queryFn: () => base44.entities.DocumentComment?.filter?.({
      document_id: documentId
    }) || []
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text) => {
      return await base44.entities.DocumentComment.create({
        document_id: documentId,
        text: text,
        user_email: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', documentId] });
      setNewComment('');
      toast.success('Kommentar hinzugefügt');
    }
  });

  const resolveCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const user = await base44.auth.me();
      return await base44.entities.DocumentComment.update(commentId, {
        resolved: true,
        resolved_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', documentId] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      return await base44.entities.DocumentComment.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', documentId] });
      toast.success('Kommentar gelöscht');
    }
  });

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4" />
          Kommentare {unresolvedCount > 0 && <Badge>{unresolvedCount}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentar hinzufügen..."
            rows={3}
            className="text-sm"
          />
          <Button
            onClick={() => createCommentMutation.mutate(newComment)}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="w-full"
          >
            Kommentar posten
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Noch keine Kommentare</p>
          ) : (
            comments.map(comment => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border ${
                  comment.resolved
                    ? 'bg-green-50 border-green-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm text-slate-700">
                      {comment.user_email.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(comment.created_date), 'HH:mm:ss', { locale: de })}
                    </p>
                  </div>
                  {comment.resolved && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                      Gelöst
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700 mb-3">{comment.text}</p>
                <div className="flex gap-2">
                  {!comment.resolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1"
                      onClick={() => resolveCommentMutation.mutate(comment.id)}
                    >
                      <Check className="w-3 h-3" />
                      Gelöst
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1 text-red-600 hover:text-red-700"
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Löschen
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}