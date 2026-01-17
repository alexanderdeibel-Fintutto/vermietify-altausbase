import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VfAlert({ 
  variant = 'info',
  title,
  description,
  children,
  className 
}) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
  };

  const Icon = icons[variant];

  return (
    <Alert variant={variant} className={className}>
      {Icon && <Icon className="vf-alert-icon" />}
      {title && <AlertTitle className="vf-alert-title">{title}</AlertTitle>}
      {description && <AlertDescription className="vf-alert-description">{description}</AlertDescription>}
      {children}
    </Alert>
  );
}