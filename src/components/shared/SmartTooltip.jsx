import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, AlertCircle } from 'lucide-react';

export default function SmartTooltip({ 
  children, 
  title, 
  content, 
  type = 'info',
  position = 'top',
  showIcon = true 
}) {
  const icons = {
    info: Info,
    help: HelpCircle,
    warning: AlertCircle
  };

  const colors = {
    info: 'text-blue-600',
    help: 'text-gray-600',
    warning: 'text-amber-600'
  };

  const Icon = icons[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {showIcon ? (
            <button className={`inline-flex ${colors[type]} hover:opacity-70 transition-opacity`}>
              <Icon className="w-4 h-4" />
            </button>
          ) : (
            <span className="cursor-help">{children}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side={position} className="max-w-xs">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{content || children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}