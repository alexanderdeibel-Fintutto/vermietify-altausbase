import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';
import { MessageSquare, Send } from 'lucide-react';

export default function CommentsPanel({ entityId, entityType }) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([
    { id: 1, user: 'Max Mustermann', text: 'Bitte Vertrag bis Ende März verlängern', created_date: new Date() }
  ]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: Date.now(),
      user: 'Aktueller Nutzer',
      text: newComment,
      created_date: new Date()
    }]);
    setNewComment('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Kommentare
          <span className="vf-badge vf-badge-primary">{comments.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">{comment.user}</span>
                <TimeAgo date={comment.created_date} className="text-xs" />
              </div>
              <p className="text-sm text-[var(--theme-text-secondary)]">{comment.text}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <VfTextarea
            placeholder="Kommentar hinzufügen..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button variant="gradient" onClick={handleSubmit}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}