import React from 'react';
import { useFeatureAccess } from '@/components/hooks/useFeatureAccess';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function FeatureGateInline({ feature, children, disabledTooltip = 'Feature gesperrt' }) {
  const { data: access, isLoading } = useFeatureAccess(feature);

  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  if (access?.hasAccess) {
    return children;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="opacity-50 pointer-events-none cursor-not-allowed">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}