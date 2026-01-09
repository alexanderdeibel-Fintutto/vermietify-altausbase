import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus, Edit, Trash2, Share2, MessageSquare, TrendingUp, Download, Zap
} from 'lucide-react';

const ACTION_ICONS = {
  asset_created: Plus,
  asset_updated: Edit,
  asset_deleted: Trash2,
  price_updated: TrendingUp,
  share_created: Share2,
  comment_added: MessageSquare,
  export_requested: Download,
  tax_form_generated: Zap
};

export default function TeamActivityFeed({ portfolioId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['teamActivityLog', portfolioId],
    queryFn: async () => {
      return await base44.entities.TeamActivityLog.filter(
        { portfolio_id: portfolioId },
        '-timestamp',
        100
      ) || [];
    },
    refetchInterval: 30000
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team-Aktivität</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTION_ICONS[activity.action_type] || Plus;
            
            return (
              <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-b-0">
                <div className="pt-1">
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {activity.user_email} {activity.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: de
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.action_type}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}