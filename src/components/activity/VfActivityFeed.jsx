import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function VfActivityFeed({ 
  entityType, 
  entityId, 
  limit = 20,
  groupByDay = true 
}) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activity', entityType, entityId],
    queryFn: async () => {
      const data = await base44.entities.ActivityLog.list('-created_date', limit);
      return data;
    }
  });

  if (groupByDay) {
    const grouped = groupActivitiesByDate(activities);
    
    return (
      <div className="vf-activity-feed">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="vf-activity-group">
            <div className="vf-activity-group__date">{date}</div>
            {items.map((activity) => (
              <VfActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="vf-activity-feed">
      {activities.map((activity) => (
        <VfActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

export function VfActivityItem({ activity }) {
  const timeAgo = formatDistanceToNow(new Date(activity.created_date), {
    addSuffix: true,
    locale: de
  });

  const userInitials = activity.created_by 
    ? activity.created_by.split('@')[0].substring(0, 2).toUpperCase()
    : '??';

  return (
    <div className="vf-activity-item">
      <div className="vf-activity-item__avatar">
        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[var(--theme-primary)]">
          {userInitials}
        </div>
      </div>
      <div className="vf-activity-item__content">
        <div className="vf-activity-item__text">
          <strong>{activity.created_by}</strong> {activity.description}
        </div>
        <div className="vf-activity-item__time">{timeAgo}</div>
      </div>
    </div>
  );
}

function groupActivitiesByDate(activities) {
  const grouped = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.created_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Gestern';
    } else {
      dateKey = date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(activity);
  });
  
  return grouped;
}