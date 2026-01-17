import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { VfModal } from '@/components/shared/VfModal';
import MobileMessaging from '@/components/mobile/MobileMessaging';

export default function InAppChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, content: 'Hallo! Wie kann ich Ihnen helfen?', sender: 'support', created_date: new Date() }
  ]);

  const handleSend = (message) => {
    setMessages([...messages, { 
      id: Date.now(), 
      content: message, 
      sender: 'user',
      created_date: new Date()
    }]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-[var(--vf-gradient-primary)] text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-110 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <VfModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Support-Chat"
      >
        <div className="h-96">
          <MobileMessaging messages={messages} onSend={handleSend} />
        </div>
      </VfModal>
    </>
  );
}