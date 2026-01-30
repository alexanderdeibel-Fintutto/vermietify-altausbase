import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function HelpIcon({ content, title, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${className}`}
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">
        {title && <h4 className="font-semibold mb-2">{title}</h4>}
        <div className="text-gray-600 dark:text-gray-300">
          {typeof content === 'string' ? content : content}
        </div>
      </PopoverContent>
    </Popover>
  );
}