import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ALERT_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: 'border-red-200 bg-red-50',
    textColor: 'text-red-900',
    titleColor: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'border-amber-200 bg-amber-50',
    textColor: 'text-amber-900',
    titleColor: 'text-amber-800',
  },
  info: {
    icon: Info,
    color: 'border-blue-200 bg-blue-50',
    textColor: 'text-blue-900',
    titleColor: 'text-blue-800',
  },
};

export default function CriticalAlerts({ 
  alerts = [],
  onDismiss,
  actionable = true
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => {
        const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.info;
        const Icon = config.icon;

        return (
          <Alert key={idx} className={`border ${config.color}`}>
            <Icon className={`h-4 w-4 ${config.titleColor}`} />
            <AlertTitle className={config.titleColor}>
              {alert.title}
            </AlertTitle>
            <AlertDescription className={config.textColor}>
              {alert.message}
            </AlertDescription>
            {actionable && alert.action && (
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() => alert.action?.()}
                  size="sm"
                  className="h-7 text-xs"
                  variant={alert.type === 'critical' ? 'default' : 'outline'}
                >
                  {alert.actionLabel || 'Mehr erfahren'}
                </Button>
                {onDismiss && (
                  <Button
                    onClick={() => onDismiss(idx)}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                  >
                    Schließen
                  </Button>
                )}
              </div>
            )}
          </Alert>
        );
      })}
    </div>
  );
}