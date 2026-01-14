import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const variantConfig = {
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-900',
    iconColor: 'text-blue-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    iconColor: 'text-amber-600'
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-900',
    iconColor: 'text-green-600'
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-900',
    iconColor: 'text-red-600'
  }
};

export default function NotificationBanner({
  title,
  message,
  variant = 'info',
  dismissible = true,
  action,
  onDismiss
}) {
  const [visible, setVisible] = useState(true);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Alert className={cn(config.className, 'relative')}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
            <div className="flex-1">
              {title && <AlertTitle className="mb-1">{title}</AlertTitle>}
              <AlertDescription>{message}</AlertDescription>
            </div>
            <div className="flex items-center gap-2">
              {action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={action.onClick}
                  className="ml-auto"
                >
                  {action.label}
                </Button>
              )}
              {dismissible && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}