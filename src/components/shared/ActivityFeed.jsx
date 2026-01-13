import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, DollarSign, Home, Edit2, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const ACTIVITY_ICONS = {
  CREATE: <Plus className="w-4 h-4" />,
  UPDATE: <Edit2 className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />,
};

const ENTITY_ICONS = {
  Invoice: <FileText className="w-4 h-4" />,
  Tenant: <Users className="w-4 h-4" />,
  LeaseContract: <DollarSign className="w-4 h-4" />,
  Building: <Home className="w-4 h-4" />,
};

const ACTION_LABELS = {
  CREATE: 'erstellt',
  UPDATE: 'aktualisiert',
  DELETE: 'gelöscht'
};

export default function ActivityFeed({ buildingId, limit = 10 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activity-feed', buildingId],
    queryFn: async () => {
      const logs = await base44.entities.AuditLog.filter(
        { building_id: buildingId },
        '-created_date',
        limit
      );
      return logs;
    },
    enabled: !!buildingId
  });

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-4 text-sm">Aktivitäts-Feed</h4>
        
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Keine Aktivitäten</p>
          ) : (
            activities.map((activity, idx) => (
              <div key={idx} className="flex gap-3 text-sm pb-3 border-b last:border-0">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  {ENTITY_ICONS[activity.entity_type] || ACTIVITY_ICONS[activity.action]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 truncate">
                    <span className="font-medium">{activity.created_by || 'System'}</span>
                    {' '}{ACTION_LABELS[activity.action]}{' '}
                    <span className="font-medium">{activity.entity_type}</span>
                  </p>
                  {activity.description && (
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {activity.description}
                    </p>
                  )}
                </div>

                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {format(new Date(activity.created_date), 'HH:mm', { locale: de })}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}