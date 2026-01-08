import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, Send, Archive, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AuditTrailCard({ submission }) {
  const events = [];

  if (submission.created_date) {
    events.push({
      type: 'CREATED',
      date: submission.created_date,
      label: 'Erstellt',
      icon: FileText,
      user: submission.created_by
    });
  }

  if (submission.status === 'AI_PROCESSED' || submission.ai_confidence_score) {
    events.push({
      type: 'AI_PROCESSED',
      date: submission.updated_date || submission.created_date,
      label: 'KI-Verarbeitung',
      icon: CheckCircle,
      details: `Vertrauen: ${submission.ai_confidence_score}%`
    });
  }

  if (submission.status === 'VALIDATED') {
    events.push({
      type: 'VALIDATED',
      date: submission.updated_date,
      label: 'Validiert',
      icon: CheckCircle
    });
  }

  if (submission.submission_date) {
    events.push({
      type: 'SUBMITTED',
      date: submission.submission_date,
      label: 'Übermittelt',
      icon: Send,
      details: submission.transfer_ticket ? `Ticket: ${submission.transfer_ticket}` : null
    });
  }

  if (submission.status === 'ACCEPTED') {
    events.push({
      type: 'ACCEPTED',
      date: submission.updated_date,
      label: 'Akzeptiert',
      icon: CheckCircle
    });
  }

  if (submission.status === 'REJECTED') {
    events.push({
      type: 'REJECTED',
      date: submission.updated_date,
      label: 'Abgelehnt',
      icon: AlertCircle
    });
  }

  if (submission.archived_at) {
    events.push({
      type: 'ARCHIVED',
      date: submission.archived_at,
      label: 'Archiviert',
      icon: Archive
    });
  }

  const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedEvents.map((event, idx) => {
            const Icon = event.icon;
            return (
              <div key={idx} className="flex gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  {idx < sortedEvents.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-slate-200" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{event.label}</span>
                    {event.type === 'ACCEPTED' && <Badge className="bg-green-600">✓</Badge>}
                    {event.type === 'REJECTED' && <Badge variant="destructive">✗</Badge>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(event.date), 'dd.MM.yyyy, HH:mm', { locale: de })}
                  </div>
                  {event.user && (
                    <div className="text-xs text-slate-500 mt-1">
                      von: {event.user}
                    </div>
                  )}
                  {event.details && (
                    <div className="text-xs text-slate-600 mt-1">
                      {event.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}