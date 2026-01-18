import React from 'react';
import TimeAgo from './TimeAgo';
import { Circle } from 'lucide-react';

export default function ActivityTimeline({ activities = [] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--theme-border)]" />
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="relative flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)] flex items-center justify-center z-10">
              <Circle className="h-3 w-3 text-white fill-white" />
            </div>
            <div className="flex-1 pb-4">
              <div className="font-medium text-sm">{activity.title}</div>
              <div className="text-xs text-[var(--theme-text-muted)] mt-1">{activity.description}</div>
              <TimeAgo date={activity.created_date} className="text-xs text-[var(--theme-text-muted)] mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}