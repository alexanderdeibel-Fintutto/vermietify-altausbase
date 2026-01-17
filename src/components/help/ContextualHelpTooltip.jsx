import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function ContextualHelpTooltip({ content, title }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}