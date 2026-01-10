import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Mic, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SmartActionDialog from './SmartActionDialog';

export default function SmartActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
          "transition-all duration-300 hover:scale-110"
        )}
        size="icon"
      >
        <Zap className="h-6 w-6 text-white" />
      </Button>

      <SmartActionDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}