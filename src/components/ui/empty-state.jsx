import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className
}) => {
  return (
    <div className={cn("vf-empty-state", className)}>
      {Icon && <Icon className="vf-empty-state-icon" />}
      <h3 className="vf-empty-state-title">{title}</h3>
      {description && (
        <p className="vf-empty-state-description">{description}</p>
      )}
      {action && actionLabel && (
        <Button variant="primary" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;