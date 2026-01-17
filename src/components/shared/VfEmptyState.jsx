import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function VfEmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className 
}) {
  return (
    <div className={cn(
      "vf-empty-state",
      size === 'sm' && "vf-empty-state-sm",
      size === 'lg' && "vf-empty-state-lg",
      className
    )}>
      {Icon && <Icon className="vf-empty-state-icon" />}
      <h3 className="vf-empty-state-title">{title}</h3>
      {description && <p className="vf-empty-state-description">{description}</p>}
      {action && (
        <Button 
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}