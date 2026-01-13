import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CommentsPanel({ entityType, entityId }) {
  const [comment, setComment] = useState('');
  const [mentioning, setMentioning] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      // Mock: Fetch comments for entity
      return [
        {
          id: '1',
          author: 'Max Müller',
          content: 'Rechnung eingegangen',
          timestamp: new Date(Date.now() - 3600000),
          mentions: []
        }
      ];
    }
  });

  const postMutation = useMutation({
    mutationFn: async (text) => {
      // Extract mentions from text
      const mentionRegex = /@(\w+)/g;
      const mentions = [...text.matchAll(mentionRegex)].map(m => m[1]);

      // Post comment
      return {
        content: text,
        mentions: mentions,
        timestamp: new Date()
      };
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries(['comments', entityType, entityId]);
      setComment('');
      toast.success('💬 Kommentar hinzugefügt');
    }
  });

  const handlePost = async () => {
    if (!comment.trim()) return;
    postMutation.mutate(comment);
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-slate-500">Laden...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Kommentare</p>
        ) : (
          comments.map(c => (
            <Card key={c.id} className="bg-white">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{c.author[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{c.author}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(c.timestamp).toLocaleTimeString('de')}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{c.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t pt-3">
        <div className="flex gap-2">
          <Input
            placeholder="Kommentar + @mentions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!comment.trim() || postMutation.isPending}
            className="gap-1"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Tippen Sie @ um Personen zu erwähnen
        </p>
      </div>
    </div>
  );
}