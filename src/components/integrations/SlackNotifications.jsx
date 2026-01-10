import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function SlackNotifications() {
  const [channel, setChannel] = useState('#general');
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('sendSlackNotification', { channel, message });
    },
    onSuccess: () => {
      toast.success('Nachricht an Slack gesendet');
      setMessage('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Slack-Benachrichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className="bg-purple-600">Verbunden</Badge>
        <Input
          placeholder="Channel (z.B. #general)"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        />
        <Input
          placeholder="Nachricht"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button onClick={() => sendMutation.mutate()} disabled={!message} className="w-full">
          <Send className="w-4 h-4 mr-2" />
          Senden
        </Button>
      </CardContent>
    </Card>
  );
}