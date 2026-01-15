import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';

const AIChatButton = ({ onToggleChat, tipCount = 0 }) => {
  return (
    <Button
      onClick={onToggleChat}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform hover:scale-105 transition-transform z-50"
      aria-label="Öffne Chat"
    >
      <MessageCircle className="h-7 w-7" />
      {tipCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
          {tipCount}
        </span>
      )}
    </Button>
  );
};

export default AIChatButton;