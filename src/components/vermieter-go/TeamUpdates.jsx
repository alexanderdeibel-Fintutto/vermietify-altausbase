import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamUpdates() {
  const [message, setMessage] = useState('');

  const slackMutation = useMutation({
    mutationFn: async (text) => {
      return await base44.functions.invoke('sendTeamUpdate', {
        message: text,
        channel: 'vermieter-updates'
      });
    },
    onSuccess: () => {
      toast.success('Team-Update gesendet');
      setMessage('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Team-Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Schnelle Nachricht an das gesamte Team senden (Slack)
        </p>
        
        <div className="flex gap-2">
          <Input
            placeholder="Nachricht an Team..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            onClick={() => slackMutation.mutate(message)}
            disabled={!message || slackMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMessage('✅ Rundgang abgeschlossen')}
          >
            ✅ Abgeschlossen
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMessage('🚨 Notfall - brauche Unterstützung')}
          >
            🚨 Notfall
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}