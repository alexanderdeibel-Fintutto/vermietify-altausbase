import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function MobileMessaging({ messages = [], onSend }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <Card key={msg.id}>
            <CardContent className="p-3">
              <div className="text-sm mb-1">{msg.content}</div>
              <TimeAgo date={msg.created_date} className="text-xs text-[var(--theme-text-muted)]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <VfTextarea
            placeholder="Nachricht..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 min-h-[60px]"
          />
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button 
              variant="gradient" 
              size="icon"
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}