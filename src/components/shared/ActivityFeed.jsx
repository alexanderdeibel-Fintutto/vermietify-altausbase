import React from 'react';
import ActivityTimeline from './ActivityTimeline';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ActivityFeed({ limit = 10 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: async () => {
      const logs = await base44.entities.AuditLog.list('-created_date', limit);
      return logs.map(log => ({
        title: log.action,
        description: log.details,
        timestamp: log.created_date,
        type: 'info'
      }));
    }
  });

  return <ActivityTimeline activities={activities} />;
}