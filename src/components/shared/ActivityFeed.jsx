import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { User, FileText, CheckCircle2 } from 'lucide-react';

export default function ActivityFeed({ activities = [] }) {
  const getActivityIcon = (type) => {
    const icons = {
      user_action: User,
      document: FileText,
      completed: CheckCircle2,
    };
    return icons[type] || User;
  };

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">Keine Aktivitäten</p>
      ) : (
        activities.map((activity, idx) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div key={idx} className="flex gap-3 text-sm">
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-900">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-slate-500">{activity.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(activity.timestamp), 'PPP p', { locale: de })}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}