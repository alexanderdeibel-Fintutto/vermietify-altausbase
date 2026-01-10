import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity } from 'lucide-react';

export default function ActivityAuditLog() {
  const { data: activities = [] } = useQuery({
    queryKey: ['auditLog'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAuditLog', {});
      return response.data.activities;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Aktivitäts-Protokoll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.map((activity, idx) => (
          <div key={idx} className="p-2 bg-slate-50 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{activity.user_name}</p>
                <p className="text-xs text-slate-600">{activity.action}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                <p className="text-xs text-slate-500 mt-1">{new Date(activity.timestamp).toLocaleString('de-DE')}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}