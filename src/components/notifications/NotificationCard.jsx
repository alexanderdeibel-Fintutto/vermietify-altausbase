import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TimeAgo from '@/components/shared/TimeAgo';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationCard({ notification, onClick, onDismiss }) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle
  };

  const Icon = icons[notification.type] || Bell;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        !notification.is_read && "border-l-4 border-l-[var(--vf-primary-600)] bg-[var(--vf-primary-50)]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            notification.type === 'success' && "bg-[var(--vf-success-100)] text-[var(--vf-success-600)]",
            notification.type === 'error' && "bg-[var(--vf-error-100)] text-[var(--vf-error-600)]",
            notification.type === 'warning' && "bg-[var(--vf-warning-100)] text-[var(--vf-warning-600)]",
            (!notification.type || notification.type === 'info') && "bg-[var(--vf-info-100)] text-[var(--vf-info-600)]"
          )}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-1">{notification.title}</div>
            {notification.message && (
              <div className="text-sm text-[var(--theme-text-secondary)] line-clamp-2">
                {notification.message}
              </div>
            )}
            <div className="text-xs text-[var(--theme-text-muted)] mt-2">
              <TimeAgo date={notification.created_date} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}