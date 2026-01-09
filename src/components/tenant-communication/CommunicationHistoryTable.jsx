import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Eye } from 'lucide-react';

export default function CommunicationHistoryTable({ communications = [], tenants = {}, buildings = {} }) {
  const typeLabels = {
    announcement: '📢 Ankündigung',
    individual_message: '💬 Einzelnachricht',
    notification: '🔔 Benachrichtigung'
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-green-100 text-green-700',
    scheduled: 'bg-yellow-100 text-yellow-700'
  };

  if (communications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Kommunikationen vorhanden</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {communications.map(comm => (
        <Card key={comm.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-light text-slate-900">{comm.title}</h4>
                <Badge className={statusColors[comm.status]}>
                  {comm.status === 'sent' ? '✅' : comm.status === 'draft' ? '📝' : '⏳'}
                </Badge>
                <Badge className={priorityColors[comm.priority]}>
                  {comm.priority}
                </Badge>
              </div>

              <p className="text-sm font-light text-slate-600 mt-2">{comm.content.substring(0, 100)}...</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
                <div>
                  <p className="text-slate-500 font-light">Typ</p>
                  <p className="font-light text-slate-900">{typeLabels[comm.communication_type]}</p>
                </div>

                <div>
                  <p className="text-slate-500 font-light">Empfänger</p>
                  <p className="font-light text-slate-900">
                    {comm.communication_type === 'announcement'
                      ? comm.recipient_type === 'all_tenants' ? 'Alle Mieter' : `Gebäude: ${buildings[comm.building_id]?.name}`
                      : comm.recipient_emails?.length > 0 ? comm.recipient_emails[0] : '—'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-light">Versendet am</p>
                  <p className="font-light text-slate-900">
                    {format(new Date(comm.created_date), 'd. MMM yyyy HH:mm', { locale: de })}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-light">Von</p>
                  <p className="font-light text-slate-900 truncate">{comm.sender_email}</p>
                </div>
              </div>

              {comm.read_by && comm.read_by.length > 0 && (
                <div className="mt-3 p-2 bg-slate-50 rounded text-xs">
                  <p className="text-slate-600 font-light">
                    <Eye className="w-3 h-3 inline mr-1" />
                    Gelesen von {comm.read_by.length} von {comm.recipient_emails?.length || 'mehreren'} Empfängern
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}