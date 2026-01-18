import React from 'react';
import TimeAgo from './TimeAgo';
import { Circle } from 'lucide-react';

export default function ActivityTimeline({ activities = [] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[var(--theme-primary-light)] flex items-center justify-center flex-shrink-0">
              <Circle className="h-3 w-3 text-[var(--theme-primary)]" fill="currentColor" />
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-[var(--theme-border)] min-h-[20px]" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="font-medium text-sm">{activity.title}</div>
            <div className="text-sm text-[var(--theme-text-secondary)] mt-1">{activity.description}</div>
            <TimeAgo date={activity.created_date} className="text-xs text-[var(--theme-text-muted)] mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}