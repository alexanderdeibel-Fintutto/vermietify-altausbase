import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WorkflowStepComments({ 
  workflowId, 
  stepId, 
  companyId,
  onCommentAdded 
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: stepComments = [], refetch } = useQuery({
    queryKey: ['step-comments', stepId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowComment.filter({
        workflow_id: workflowId,
        step_id: stepId
      }, '-created_date');
      return result;
    },
    enabled: showComments
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('handleWorkflowComment', {
        company_id: companyId,
        workflow_id: workflowId,
        step_id: stepId,
        content: commentText,
        type: 'comment'
      }),
    onSuccess: () => {
      setCommentText('');
      refetch();
      onCommentAdded?.();
    }
  });

  const hasUnresolvedComments = stepComments.some(c => !c.resolved);

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowComments(!showComments)}
        className={`gap-2 ${hasUnresolvedComments ? 'text-red-600' : ''}`}
      >
        <MessageCircle className="w-4 h-4" />
        {stepComments.length}
      </Button>

      {showComments && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 p-4 space-y-3">
          {/* Comment Input */}
          <div>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Kommentar zu diesem Schritt..."
              className="h-16 text-xs"
            />
            <Button
              size="sm"
              onClick={() => commentMutation.mutate()}
              disabled={!commentText || commentMutation.isPending}
              className="mt-2 w-full"
            >
              Posten
            </Button>
          </div>

          {/* Comments Display */}
          {stepComments.length === 0 ? (
            <p className="text-xs text-slate-500">Keine Kommentare</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stepComments.map(comment => (
                <div key={comment.id} className="p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs font-medium">{comment.author_email}</p>
                  <p className="text-xs text-slate-700 mt-1">{comment.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">
                      {format(new Date(comment.created_date), 'p', { locale: de })}
                    </span>
                    {comment.resolved && (
                      <Badge variant="outline" className="text-xs bg-green-50">
                        Gelöst
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}