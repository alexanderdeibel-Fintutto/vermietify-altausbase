import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, MessageSquare, AlertCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WorkflowCollaborationPanel({ workflowId, companyId }) {
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('comment');
  const [mentions, setMentions] = useState([]);
  const [mentionInput, setMentionInput] = useState('');

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['workflow-comments', workflowId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowComment.filter({
        workflow_id: workflowId
      }, '-created_date');
      return result;
    }
  });

  const { data: session } = useQuery({
    queryKey: ['collaboration-session', workflowId],
    queryFn: async () => {
      const sessions = await base44.asServiceRole.entities.WorkflowCollaborationSession.filter({
        workflow_id: workflowId
      }, '-last_modified_at', 1);
      return sessions[0];
    },
    refetchInterval: 5000
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        return await base44.asServiceRole.entities.User.list();
      } catch {
        return [];
      }
    }
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('handleWorkflowComment', {
        company_id: companyId,
        workflow_id: workflowId,
        content: commentText,
        type: commentType,
        mentions
      }),
    onSuccess: () => {
      setCommentText('');
      setMentions([]);
      setCommentType('comment');
      refetchComments();
    }
  });

  const toggleMention = (email) => {
    setMentions(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const getCommentIcon = (type) => {
    switch (type) {
      case 'suggestion':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'approval':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'change_notification':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  const unreadComments = comments.filter(c => c.type === 'suggestion' || c.type === 'approval');

  return (
    <div className="space-y-4">
      {/* Active Editors */}
      {session?.active_editors && session.active_editors.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                {session.active_editors.length} aktive Bearbeiter
              </p>
            </div>
            <div className="flex gap-2">
              {session.active_editors.map(editor => (
                <div key={editor.user_email} className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {editor.user_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-blue-700">{editor.user_name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comment Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Kommentar hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Geben Sie einen Kommentar ein..."
            className="h-20"
          />

          {/* Comment Type */}
          <div className="flex gap-2">
            {['comment', 'suggestion', 'approval'].map(type => (
              <Button
                key={type}
                size="sm"
                variant={commentType === type ? 'default' : 'outline'}
                onClick={() => setCommentType(type)}
              >
                {type === 'comment' && 'Kommentar'}
                {type === 'suggestion' && 'Vorschlag'}
                {type === 'approval' && 'Genehmigung'}
              </Button>
            ))}
          </div>

          {/* Mentions */}
          <div>
            <p className="text-xs font-medium mb-1">Erwähnungen</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {mentions.map(email => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleMention(email)}
                >
                  {allUsers.find(u => u.email === email)?.full_name || email}
                  {' '}✕
                </Badge>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {allUsers
                .filter(u => !mentions.includes(u.email))
                .slice(0, 5)
                .map(user => (
                  <Button
                    key={user.email}
                    size="xs"
                    variant="outline"
                    className="text-xs"
                    onClick={() => toggleMention(user.email)}
                  >
                    + {user.full_name}
                  </Button>
                ))}
            </div>
          </div>

          <Button
            onClick={() => commentMutation.mutate()}
            disabled={!commentText || commentMutation.isPending}
            className="w-full"
          >
            {commentMutation.isPending ? 'Wird gepostet...' : 'Posten'}
          </Button>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Kommentare ({comments.length})
            {unreadComments.length > 0 && (
              <Badge className="bg-red-100 text-red-700 ml-auto">
                {unreadComments.length} wichtig
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">Keine Kommentare</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="p-2 border rounded-lg bg-slate-50">
                  <div className="flex items-start gap-2">
                    {getCommentIcon(comment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{comment.author_email}</p>
                      <p className="text-xs text-slate-700 break-words mt-1">{comment.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">
                          {format(new Date(comment.created_date), 'Pp', { locale: de })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {comment.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}