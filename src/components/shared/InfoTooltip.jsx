import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function InfoTooltip({ text, side = 'top', children }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}