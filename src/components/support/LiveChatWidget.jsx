import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import MobileMessaging from '@/components/mobile/MobileMessaging';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'support', content: 'Hallo! Wie kann ich Ihnen helfen?', created_date: new Date() }
  ]);

  const handleSend = (content) => {
    setMessages([...messages, {
      id: Date.now(),
      sender: 'user',
      content,
      created_date: new Date()
    }]);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white border border-[var(--theme-border)] rounded-lg shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Live-Support</h3>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <MobileMessaging messages={messages} onSend={handleSend} />
          </div>
        </div>
      )}

      <Button
        variant="gradient"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
}