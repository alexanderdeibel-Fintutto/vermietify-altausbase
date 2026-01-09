import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search } from 'lucide-react';

const typeIcons = {
  message: '💬',
  inquiry: '❓',
  complaint: '⚠️',
  maintenance_request: '🔧'
};

const statusColors = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700'
};

export default function ConversationList({ onSelectConversation, userRole = 'admin' }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => base44.entities.TenantMessage.list('-created_date', 500),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant?.list?.('-updated_date', 200).catch(() => []),
  });

  // Group messages by conversation
  const conversations = useMemo(() => {
    const convMap = {};

    allMessages.forEach(msg => {
      if (!convMap[msg.conversation_id]) {
        convMap[msg.conversation_id] = {
          id: msg.conversation_id,
          tenant_id: msg.tenant_id,
          unit_id: msg.unit_id,
          building_id: msg.building_id,
          messages: []
        };
      }
      convMap[msg.conversation_id].messages.push(msg);
    });

    // Filter and enhance conversations
    return Object.values(convMap)
      .map(conv => {
        const tenant = tenants.find(t => t.id === conv.tenant_id);
        const lastMessage = conv.messages[conv.messages.length - 1];
        const unreadCount = conv.messages.filter(m => !m.is_read && 
          (userRole === 'admin' ? m.sender_type === 'tenant' : m.sender_type === 'admin')
        ).length;

        return {
          ...conv,
          tenant_name: tenant?.full_name || 'Unbekannt',
          tenant_email: tenant?.email || '',
          last_message: lastMessage,
          unread_count: unreadCount
        };
      })
      .filter(conv => {
        if (!searchQuery) return true;
        return conv.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               conv.tenant_email.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [allMessages, tenants, searchQuery, userRole]);

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Konversationen</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Mieter durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 font-light"
        />
      </div>

      {conversations.map(conv => (
        <Card
          key={conv.id}
          className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
            conv.unread_count > 0 ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onSelectConversation(conv)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-light text-slate-900">{conv.tenant_name}</h4>
              <p className="text-xs font-light text-slate-600">{conv.tenant_email}</p>
              {conv.last_message && (
                <p className="text-sm font-light text-slate-700 mt-2 truncate">
                  {typeIcons[conv.last_message.message_type]} {conv.last_message.subject || conv.last_message.content.substring(0, 50)}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {conv.unread_count > 0 && (
                <Badge className="bg-blue-600 text-white">{conv.unread_count}</Badge>
              )}
              <p className="text-xs font-light text-slate-600">
                {conv.last_message && format(new Date(conv.last_message.created_date), 'd. MMM HH:mm', { locale: de })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}