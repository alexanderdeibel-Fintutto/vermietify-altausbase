import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RecentActivityWidget() {
  const { data: activities = [] } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => base44.entities.UserActivity.list('-created_date', 5)
  });

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{activity.action_type}</div>
            <div className="text-xs text-slate-600 truncate">{activity.resource}</div>
          </div>
          <div className="text-xs text-slate-500">
            {format(parseISO(activity.created_date), 'HH:mm', { locale: de })}
          </div>
        </div>
      ))}
    </div>
  );
}