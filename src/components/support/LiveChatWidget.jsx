import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send } from 'lucide-react';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl border border-[var(--theme-border)] z-50">
          <div className="flex items-center justify-between p-4 bg-[var(--vf-gradient-primary)] text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Support Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="h-96 p-4 overflow-y-auto bg-[var(--theme-surface)]">
            <div className="text-center text-sm text-[var(--theme-text-muted)] py-8">
              Stellen Sie uns Ihre Frage
            </div>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <VfTextarea
                placeholder="Ihre Nachricht..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
              <Button variant="gradient">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--vf-gradient-primary)] text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-40"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}