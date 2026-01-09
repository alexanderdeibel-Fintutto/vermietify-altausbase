import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Ticket, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SupportTicketManager({ tenantView = false, tenantId = null }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ['supportTickets', tenantId],
    queryFn: () => {
      if (tenantView && tenantId) {
        return base44.entities.SupportTicket.filter({ tenant_id: tenantId }, '-created_at', 100);
      }
      return base44.entities.SupportTicket.list('-created_at', 100);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      toast.success('Ticket aktualisiert');
      setSelectedTicket(null);
    }
  });

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    waiting_tenant: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-slate-100 text-slate-800'
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Support-Tickets
        </h2>
        {!tenantView && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="resolved">Gelöst</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map(ticket => (
          <Card
            key={ticket.id}
            onClick={() => !tenantView && setSelectedTicket(ticket)}
            className={`hover:shadow-md transition-shadow ${!tenantView ? 'cursor-pointer' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">#{ticket.ticket_number}</p>
                  <CardTitle className="text-base">{ticket.subject}</CardTitle>
                </div>
                <Badge className={priorityColors[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                <p className="text-xs text-slate-500">{ticket.category}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={(data) => updateMutation.mutate({ id: selectedTicket.id, data })}
        />
      )}
    </div>
  );
}

function TicketDetailDialog({ ticket, onClose, onUpdate }) {
  const [status, setStatus] = useState(ticket.status);
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolution_notes || '');

  const handleResolve = async () => {
    const user = await base44.auth.me();
    onUpdate({
      status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_at: new Date().toISOString(),
      resolved_by: user.email
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ticket #{ticket.ticket_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600">Mieter</p>
              <p className="font-semibold">{ticket.tenant_email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Kategorie</p>
              <p className="font-semibold">{ticket.category}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Priorität</p>
              <Badge className={ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                {ticket.priority}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-600">Quelle</p>
              <p className="font-semibold">{ticket.source}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Beschreibung</p>
            <p className="text-sm p-3 bg-slate-50 rounded border">{ticket.description}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Status</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Offen</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="waiting_tenant">Wartet auf Mieter</SelectItem>
                <SelectItem value="resolved">Gelöst</SelectItem>
                <SelectItem value="closed">Geschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Lösungsnotizen</p>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Notizen zur Lösung..."
              className="min-h-24"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={() => onUpdate({ status })} variant="outline">Status aktualisieren</Button>
            <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Als gelöst markieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}