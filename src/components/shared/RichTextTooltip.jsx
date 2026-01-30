import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

export default function RichTextTooltip({ 
  trigger, 
  title, 
  content, 
  image, 
  footer,
  width = 'w-80' 
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {trigger || (
          <button className="inline-flex text-blue-600 hover:text-blue-700 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        )}
      </HoverCardTrigger>
      <HoverCardContent className={width}>
        {image && (
          <img src={image} alt={title} className="w-full h-32 object-cover rounded-lg mb-3" />
        )}
        
        {title && (
          <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
            {title}
          </h4>
        )}
        
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          {content}
        </div>

        {footer && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            {footer}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}