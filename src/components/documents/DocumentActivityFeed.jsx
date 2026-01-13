import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Edit, Eye, Share2, CheckCircle, Trash2 } from 'lucide-react';

const actionIcons = {
  created: Edit,
  edited: Edit,
  deleted: Trash2,
  viewed: Eye,
  shared: Share2,
  approved: CheckCircle
};

const actionLabels = {
  created: 'Erstellt',
  edited: 'Bearbeitet',
  deleted: 'Gelöscht',
  viewed: 'Angesehen',
  shared: 'Geteilt',
  approved: 'Genehmigt'
};

export default function DocumentActivityFeed({ documentId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['document-activity-feed', documentId],
    queryFn: () => base44.entities.DocumentActivity?.filter?.({ 
      document_id: documentId
    }) || [],
    refetchInterval: 5000
  });

  useEffect(() => {
    const unsubscribe = base44.entities.DocumentActivity?.subscribe?.((event) => {
      if (event.data?.document_id === documentId) {
        // Feed will auto-update via query refetch
      }
    });
    return () => unsubscribe?.();
  }, [documentId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Keine Aktivitäten</p>
          ) : (
            activities
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
              .slice(0, 20)
              .map(activity => {
                const Icon = actionIcons[activity.action] || Edit;
                return (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700">
                        {actionLabels[activity.action]}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {activity.user_email.split('@')[0]}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-slate-600 mt-1">{activity.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(activity.created_date), 'HH:mm:ss', { locale: de })}
                      </p>
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