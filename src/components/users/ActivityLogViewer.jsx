import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Activity, FileText, Trash2, Save, Eye, 
  LogIn, LogOut 
} from 'lucide-react';

export default function ActivityLogViewer({ userId, limit = 50 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities', userId],
    queryFn: async () => {
      const acts = await base44.asServiceRole.entities.UserActivity.filter({ 
        user_id: userId 
      });
      return acts.slice(0, limit);
    },
    enabled: !!userId
  });

  const getActionIcon = (actionType) => {
    const icons = {
      login: LogIn,
      logout: LogOut,
      page_view: Eye,
      form_submit: Save,
      document_create: FileText,
      entity_update: Save,
      entity_delete: Trash2,
      api_call: Activity
    };
    return icons[actionType] || Activity;
  };

  const getActionColor = (actionType) => {
    const colors = {
      login: 'text-green-600',
      logout: 'text-slate-600',
      page_view: 'text-blue-600',
      form_submit: 'text-purple-600',
      document_create: 'text-emerald-600',
      entity_update: 'text-orange-600',
      entity_delete: 'text-red-600',
      api_call: 'text-slate-600'
    };
    return colors[actionType] || 'text-slate-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitäts-Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.map(activity => {
            const Icon = getActionIcon(activity.action_type);
            const color = getActionColor(activity.action_type);
            
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                <Icon className={`w-4 h-4 mt-1 ${color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{activity.action_type}</span>
                    <Badge variant="outline" className="text-xs">{activity.resource}</Badge>
                  </div>
                  {activity.resource_id && (
                    <div className="text-xs text-slate-500 mt-1">
                      ID: {activity.resource_id}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    {format(new Date(activity.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
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