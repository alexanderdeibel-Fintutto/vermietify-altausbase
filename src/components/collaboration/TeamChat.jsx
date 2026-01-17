import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Users, Send } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function TeamChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'Max M.', content: 'Objekt Hauptstr. 12 - Heizung repariert', created_date: new Date() }
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, {
        id: Date.now(),
        user: 'Du',
        content: message,
        created_date: new Date()
      }]);
      setMessage('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team-Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{msg.user}</span>
                  <TimeAgo date={msg.created_date} className="text-xs text-[var(--theme-text-muted)]" />
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <VfInput
              placeholder="Nachricht eingeben..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button variant="gradient" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}