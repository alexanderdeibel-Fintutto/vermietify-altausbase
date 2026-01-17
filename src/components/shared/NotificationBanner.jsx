import React from 'react';
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationBanner({ 
  type = 'info', 
  message, 
  onDismiss 
}) {
  const config = {
    info: { icon: Info, bg: 'bg-[var(--vf-info-50)]', border: 'border-[var(--vf-info-200)]', text: 'text-[var(--vf-info-700)]' },
    success: { icon: CheckCircle, bg: 'bg-[var(--vf-success-50)]', border: 'border-[var(--vf-success-200)]', text: 'text-[var(--vf-success-700)]' },
    warning: { icon: AlertWarning, bg: 'bg-[var(--vf-warning-50)]', border: 'border-[var(--vf-warning-200)]', text: 'text-[var(--vf-warning-700)]' }
  };

  const { icon: Icon, bg, border, text } = config[type] || config.info;

  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-lg border', bg, border)}>
      <Icon className={cn('h-5 w-5 flex-shrink-0', text)} />
      <p className={cn('flex-1 text-sm', text)}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className={text}>
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}