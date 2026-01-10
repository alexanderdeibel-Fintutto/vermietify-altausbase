import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function SlackNotifications() {
  const [message, setMessage] = React.useState('');

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('sendSlackNotification', { message });
    },
    onSuccess: () => {
      toast.success('Nachricht gesendet');
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
        <Input 
          placeholder="Nachricht an Team..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button onClick={() => sendMutation.mutate()} className="w-full">
          An Slack senden
        </Button>
      </CardContent>
    </Card>
  );
}