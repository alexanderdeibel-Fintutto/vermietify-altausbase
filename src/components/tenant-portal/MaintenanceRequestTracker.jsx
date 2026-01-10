import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, Clock, CheckCircle, MessageSquare, Paperclip, Upload } from 'lucide-react';
import { toast } from 'sonner';
import MaintenanceRequestDetailDialog from './MaintenanceRequestDetailDialog';

const statusConfig = {
  pending: { label: 'Eingereicht', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  assigned: { label: 'Zugewiesen', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Bearbeitung', color: 'bg-purple-100 text-purple-800', icon: Wrench },
  completed: { label: 'Erledigt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Abgebrochen', color: 'bg-gray-100 text-gray-800', icon: Clock }
};

export default function MaintenanceRequestTracker() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [ratingTask, setRatingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', user?.email],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter({ email: user.email });
      return tenants[0];
    },
    enabled: !!user
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['tenant-maintenance-requests', tenant?.id],
    queryFn: async () => {
      const tasks = await base44.entities.MaintenanceTask.filter({ tenant_id: tenant.id });
      return tasks.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!tenant
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Lädt...</CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Meine Wartungsanfragen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Keine Wartungsanfragen vorhanden</p>
            ) : (
              requests.map(request => {
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const hasComments = request.notes && request.notes.length > 0;
                const hasAttachments = request.attachments && request.attachments.length > 0;

                return (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.title}</h3>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{request.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>Erstellt: {new Date(request.created_date).toLocaleDateString()}</span>
                          {request.scheduled_date && (
                            <span>Geplant: {new Date(request.scheduled_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {hasComments && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        )}
                        {hasAttachments && (
                          <div className="flex items-center gap-1 text-purple-600">
                            <Paperclip className="w-4 h-4" />
                            <span className="text-xs">{request.attachments.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRequest && (
        <MaintenanceRequestDetailDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          tenantId={tenant?.id}
        />
      )}
    </>
  );
}