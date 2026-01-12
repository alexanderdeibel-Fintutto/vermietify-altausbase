import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function InfoTooltip({ content, children, side = 'right', maxWidth = '300px' }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || <HelpCircle className="h-4 w-4 text-slate-400 cursor-help inline ml-1" />}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-sm">
          <p className="text-slate-50">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}