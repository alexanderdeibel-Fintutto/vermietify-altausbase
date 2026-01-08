import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CommentSection({ submissionId }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['submission-comments', submissionId],
    queryFn: async () => {
      const logs = await base44.entities.ActivityLog.filter({
        entity_type: 'ElsterSubmission',
        entity_id: submissionId,
        action: 'comment_added'
      });
      return logs.sort((a, b) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    },
    enabled: !!submissionId
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment) => base44.functions.invoke('addSubmissionComment', {
      submission_id: submissionId,
      comment
    }),
    onSuccess: () => {
      toast.success('Kommentar hinzugefügt');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Kommentare ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentar hinzufügen..."
            rows={3}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            Senden
          </Button>
        </form>

        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Noch keine Kommentare</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {comment.metadata?.user_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.metadata?.user_name || 'Unbekannt'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(comment.created_date).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {comment.changes?.comment}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}