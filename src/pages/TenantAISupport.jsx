import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function TenantAISupport() {
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => base44.entities.TenantSupportTicket.list('-created_date', 100)
  });

  const resolveMutation = useMutation({
    mutationFn: async (ticketId) => {
      return await base44.entities.TenantSupportTicket.update(ticketId, { 
        status: 'resolved'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    }
  });

  const openTickets = tickets.filter(t => t.status === 'open');
  const avgResolutionTime = tickets.filter(t => t.resolution_time_minutes).length > 0
    ? Math.round(tickets.reduce((sum, t) => sum + (t.resolution_time_minutes || 0), 0) / tickets.filter(t => t.resolution_time_minutes).length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">AI Tenant Support</h1>
          <p className="text-slate-600">24/7 KI-gestützter Mieterkostenlos-Support</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{openTickets.length}</div>
            <p className="text-sm text-slate-600">Offene Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{tickets.length}</div>
            <p className="text-sm text-slate-600">Gesamt-Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{avgResolutionTime}min</div>
            <p className="text-sm text-slate-600">Durchschn. Lösungszeit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">
              {(tickets.filter(t => t.satisfaction_rating >= 4).length / tickets.length * 100 || 0).toFixed(0)}%
            </div>
            <p className="text-sm text-slate-600">Zufriedenheit</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tickets.map(ticket => (
          <Card key={ticket.id}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-sm text-slate-600 line-clamp-1">{ticket.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                    <Badge 
                      className={
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''
                      }
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
                {ticket.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => resolveMutation.mutate(ticket.id)}
                    variant="outline"
                  >
                    Lösen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}