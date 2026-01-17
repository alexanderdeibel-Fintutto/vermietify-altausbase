import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function MobileMessaging({ messages = [], onSend }) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSend(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender === 'user' 
                ? 'bg-[var(--theme-primary)] text-white ml-12' 
                : 'bg-[var(--theme-surface)] mr-12'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
            <TimeAgo date={msg.created_date} className="text-xs opacity-75 mt-1" />
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t flex gap-2">
        <VfInput
          placeholder="Nachricht..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button variant="gradient" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}