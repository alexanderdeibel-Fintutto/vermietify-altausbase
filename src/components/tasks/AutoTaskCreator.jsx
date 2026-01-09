import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, MessageSquare, Wrench, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoTaskCreator() {
  const queryClient = useQueryClient();

  // Fetch unprocessed maintenance requests
  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['unprocessedMaintenanceRequests'],
    queryFn: async () => {
      const tasks = await base44.entities.MaintenanceTask.list('-created_date', 50);
      return tasks.filter(t => !t.auto_task_created && t.status === 'pending');
    }
  });

  // Fetch recent tenant messages
  const { data: recentMessages = [] } = useQuery({
    queryKey: ['recentTenantMessages'],
    queryFn: async () => {
      const messages = await base44.entities.TenantMessage.list('-created_date', 20);
      return messages.filter(m => m.direction === 'from_tenant' && !m.auto_task_created);
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ source_type, source_id, source_data }) => {
      const result = await base44.functions.invoke('createSmartTask', {
        source_type,
        source_id,
        source_data
      });
      
      // Mark source as processed
      if (source_type === 'maintenance_request' && result.data.success) {
        await base44.entities.MaintenanceTask.update(source_id, {
          auto_task_created: true
        });
      } else if (source_type === 'tenant_message' && result.data.success) {
        await base44.entities.TenantMessage.update(source_id, {
          auto_task_created: true
        });
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingTasks'] });
      queryClient.invalidateQueries({ queryKey: ['unprocessedMaintenanceRequests'] });
      queryClient.invalidateQueries({ queryKey: ['recentTenantMessages'] });
      toast.success('Aufgabe automatisch erstellt');
    }
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      {/* Maintenance Requests */}
      {maintenanceRequests.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-600" />
              Wartungsanfragen ({maintenanceRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {maintenanceRequests.slice(0, 3).map(request => (
              <div key={request.id} className="bg-white p-3 rounded border flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{request.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{request.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => createTaskMutation.mutate({
                    source_type: 'maintenance_request',
                    source_id: request.id,
                    source_data: request
                  })}
                  disabled={createTaskMutation.isPending}
                  className="ml-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto-Aufgabe
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tenant Messages */}
      {recentMessages.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Mieter-Nachrichten ({recentMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMessages.slice(0, 3).map(message => (
              <div key={message.id} className="bg-white p-3 rounded border flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-900 line-clamp-2">{message.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Von: {message.sender_name || 'Mieter'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => createTaskMutation.mutate({
                    source_type: 'tenant_message',
                    source_id: message.id,
                    source_data: message
                  })}
                  disabled={createTaskMutation.isPending}
                  className="ml-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto-Aufgabe
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {maintenanceRequests.length === 0 && recentMessages.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p>Alle Anfragen verarbeitet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}