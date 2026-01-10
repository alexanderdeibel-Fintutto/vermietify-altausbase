import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

export default function NeighborhoodForum() {
  const [post, setPost] = useState('');
  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getForumPosts', {});
      return response.data.posts;
    }
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('createForumPost', { content: post });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
      setPost('');
      toast.success('Beitrag veröffentlicht');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Nachbarschafts-Forum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={post} onChange={(e) => setPost(e.target.value)} placeholder="Neuer Beitrag..." />
          <Button size="icon" onClick={() => postMutation.mutate()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold">{p.author_name}</p>
              <p className="text-sm mt-1">{p.content}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="ghost">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {p.likes}
                </Button>
                <Badge variant="outline" className="text-xs">{new Date(p.created_date).toLocaleDateString('de-DE')}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}