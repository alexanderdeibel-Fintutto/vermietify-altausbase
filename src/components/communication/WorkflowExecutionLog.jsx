import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WorkflowExecutionLog({ open, onClose, workflow }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['communicationLogs', workflow?.id],
    queryFn: () => base44.entities.CommunicationLog.filter({ workflow_id: workflow.id }, '-created_date', 50),
    enabled: !!workflow?.id && open
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: open
  });

  const statusIcons = {
    'Versendet': CheckCircle,
    'Zugestellt': CheckCircle,
    'Fehlgeschlagen': XCircle,
    'Ausstehend': Clock
  };

  const statusColors = {
    'Versendet': 'bg-blue-100 text-blue-700',
    'Zugestellt': 'bg-emerald-100 text-emerald-700',
    'Fehlgeschlagen': 'bg-red-100 text-red-700',
    'Ausstehend': 'bg-amber-100 text-amber-700'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Versandprotokoll: {workflow?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {logs.map(log => {
            const tenant = tenants.find(t => t.id === log.tenant_id);
            const StatusIcon = statusIcons[log.versand_status] || Mail;

            return (
              <Card key={log.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`w-4 h-4 ${
                          log.versand_status === 'Versendet' || log.versand_status === 'Zugestellt' ? 'text-emerald-600' :
                          log.versand_status === 'Fehlgeschlagen' ? 'text-red-600' :
                          'text-amber-600'
                        }`} />
                        <p className="font-medium text-sm">
                          {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Mieter nicht gefunden'}
                        </p>
                        <Badge className={statusColors[log.versand_status]}>
                          {log.versand_status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.kommunikationstyp}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{log.empfaenger_email}</p>
                      {log.betreff && (
                        <p className="text-xs text-slate-500 mt-1">Betreff: {log.betreff}</p>
                      )}
                      {log.fehler_meldung && (
                        <p className="text-xs text-red-600 mt-1">Fehler: {log.fehler_meldung}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      {log.versendet_am && format(new Date(log.versendet_am), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Noch keine Versendungen
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}