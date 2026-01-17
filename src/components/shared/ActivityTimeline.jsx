import React from 'react';
import TimeAgo from './TimeAgo';
import { cn } from '@/lib/utils';

export default function ActivityTimeline({ activities = [] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activity.icon;
        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                activity.type === 'success' && "bg-[var(--vf-success-100)] text-[var(--vf-success-600)]",
                activity.type === 'error' && "bg-[var(--vf-error-100)] text-[var(--vf-error-600)]",
                activity.type === 'info' && "bg-[var(--vf-info-100)] text-[var(--vf-info-600)]",
                !activity.type && "bg-[var(--vf-primary-100)] text-[var(--vf-primary-600)]"
              )}>
                {Icon && <Icon className="h-4 w-4" />}
              </div>
              {index < activities.length - 1 && (
                <div className="w-px h-full bg-[var(--theme-border)] mt-2" />
              )}
            </div>
            
            <div className="flex-1 pb-4">
              <div className="font-medium text-sm">{activity.title}</div>
              {activity.description && (
                <div className="text-sm text-[var(--theme-text-secondary)] mt-1">
                  {activity.description}
                </div>
              )}
              <div className="text-xs text-[var(--theme-text-muted)] mt-2">
                <TimeAgo date={activity.timestamp} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}