import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function InfoTooltip({ 
  text,
  side = 'top',
  className = ''
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className={`w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help ${className}`} />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}