import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export default function InfoTooltip({ content }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)]">
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}