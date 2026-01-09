import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RecentCommunicationsWidget({ tenantId }) {
  const { data: messages = [] } = useQuery({
    queryKey: ['recentMessages', tenantId],
    queryFn: () => base44.entities.TenantMessage.filter({ tenant_id: tenantId }, '-created_at', 5)
  });

  const unreadCount = messages.filter(m => !m.is_read && m.sender_type === 'admin').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5" />
          Aktuelle Nachrichten
          {unreadCount > 0 && (
            <Badge className="bg-blue-600">{unreadCount} neu</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-600">Keine Nachrichten</p>
        ) : (
          messages.slice(0, 3).map(msg => (
            <div key={msg.id} className={`p-3 border rounded-lg ${!msg.is_read && msg.sender_type === 'admin' ? 'bg-blue-50 border-blue-200' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-semibold text-slate-700">
                  {msg.sender_type === 'admin' ? 'Verwaltung' : 'Sie'}
                </p>
                <span className="text-xs text-slate-500">
                  {new Date(msg.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              <p className="text-sm text-slate-900 line-clamp-2">{msg.message_text}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}