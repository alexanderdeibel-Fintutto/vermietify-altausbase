import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function TeamChat({ teamId }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'Max M.', text: 'Objekt Musterstraße fertig dokumentiert', created_date: new Date() }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { 
        id: Date.now(), 
        user: 'Ich', 
        text: message,
        created_date: new Date()
      }]);
      setMessage('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Team-Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <span className="font-semibold text-sm">{msg.user}</span>
                <TimeAgo date={msg.created_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
              <div className="text-sm">{msg.text}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <VfInput
            placeholder="Nachricht eingeben..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button variant="gradient" onClick={sendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}