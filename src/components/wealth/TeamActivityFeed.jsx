import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { MessageSquare, Edit2, Trash2, Plus } from 'lucide-react';

const activityIcons = {
  asset_created: Plus,
  asset_updated: Edit2,
  asset_deleted: Trash2,
  comment_added: MessageSquare
};

export default function TeamActivityFeed({ portfolioId, sharedUsers = [] }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['portfolioActivities', portfolioId],
    queryFn: async () => {
      const result = await base44.entities.ActivityLog.filter({
        entity_type: 'AssetPortfolio',
        entity_id: portfolioId
      }, '-created_date', 20) || [];
      return result;
    },
    refetchInterval: 5000
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team-Aktivität</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Aktivitäten</p>
          ) : (
            activities.map(activity => {
              const Icon = activityIcons[activity.action] || MessageSquare;
              return (
                <div key={activity.id} className="flex gap-3 p-2 hover:bg-slate-50 rounded">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-slate-700">
                      {activity.details?.user_name || 'System'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {activity.action.replace(/_/g, ' ')} •{' '}
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true, locale: de })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}