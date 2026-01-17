import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import TimeAgo from './TimeAgo';

export default function ActivityFeed({ activities = [] }) {
  const mockActivities = [
    { id: 1, user: 'Sie', action: 'Vertrag erstellt', entity: 'Mietvertrag Wohnung 3B', created_date: new Date() },
    { id: 2, user: 'Max M.', action: 'Rechnung bezahlt', entity: 'Rechnung #1234', created_date: new Date(Date.now() - 3600000) }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3 p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[var(--theme-primary-light)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[var(--theme-primary)]">
                  {activity.user.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <strong>{activity.user}</strong> {activity.action}
                </div>
                <div className="text-xs text-[var(--theme-text-muted)]">{activity.entity}</div>
                <TimeAgo date={activity.created_date} className="text-xs text-[var(--theme-text-muted)] mt-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}