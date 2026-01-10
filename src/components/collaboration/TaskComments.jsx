import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';

export default function TaskComments({ taskId }) {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTaskComments', { task_id: taskId });
      return response.data.comments;
    },
    enabled: !!taskId
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('addTaskComment', { task_id: taskId, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskComments'] });
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
        {comments.map(c => (
          <div key={c.id} className="p-2 bg-slate-50 rounded">
            <p className="text-xs font-semibold">{c.user_name}</p>
            <p className="text-sm">{c.text}</p>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Kommentar..." />
          <Button size="icon" onClick={() => addMutation.mutate()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}