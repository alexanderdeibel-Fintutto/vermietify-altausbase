import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EmptyState({ 
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className 
}) {
  return (
    <div className={cn("vf-empty-state", className)}>
      {Icon && <Icon className="vf-empty-state-icon" />}
      
      <h3 className="vf-empty-state-title">{title}</h3>
      
      {description && (
        <p className="vf-empty-state-description">{description}</p>
      )}
      
      {actionLabel && onAction && (
        <Button variant="gradient" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}