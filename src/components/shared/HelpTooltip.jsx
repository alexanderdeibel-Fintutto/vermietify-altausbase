import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function HelpTooltip({ text, children, side = 'right', maxWidth = '300px' }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || <HelpCircle className="h-4 w-4 text-slate-400 cursor-help ml-1 inline" />}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p style={{ maxWidth }}>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}