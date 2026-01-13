import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ActivityTimeline({ events = [] }) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${event.color || 'bg-slate-400'} mt-1`} />
            {idx < events.length - 1 && <div className="w-0.5 h-12 bg-slate-300 my-2" />}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium text-slate-900">{event.title}</p>
            {event.description && (
              <p className="text-xs text-slate-600 mt-1">{event.description}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {event.timestamp
                ? formatDistanceToNow(new Date(event.timestamp), {
                    locale: de,
                    addSuffix: true,
                  })
                : event.timeLabel}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}