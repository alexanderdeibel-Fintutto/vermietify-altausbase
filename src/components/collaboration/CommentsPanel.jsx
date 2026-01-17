import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function CommentsPanel({ comments = [], onAddComment }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Kommentare
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-sm">{comment.author}</span>
                <TimeAgo date={comment.created_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))}

          <div className="space-y-3 pt-4 border-t">
            <VfTextarea
              placeholder="Kommentar hinzufügen..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button 
              variant="gradient"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Senden
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}