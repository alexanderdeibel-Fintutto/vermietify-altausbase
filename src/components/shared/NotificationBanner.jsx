import React from 'react';
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationBanner({ 
  message, 
  type = 'info', 
  onDismiss,
  action 
}) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: AlertTriangle
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      "vf-alert mb-4",
      `vf-alert-${type}`
    )}>
      <Icon className="vf-alert-icon" />
      <div className="vf-alert-content flex-1">
        <p className="vf-alert-description">{message}</p>
        {action && (
          <button onClick={action.onClick} className="underline font-medium mt-1">
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}