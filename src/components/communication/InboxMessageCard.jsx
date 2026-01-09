import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bell, Megaphone, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function InboxMessageCard({ item, userEmail }) {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (item.type === 'message' && !item.is_read && item.sender_email !== userEmail) {
        await base44.entities.TenantMessage.update(item.id, { 
          is_read: true, 
          read_at: new Date().toISOString() 
        });
      } else if (item.type === 'notification' && !item.is_read) {
        await base44.entities.Notification.update(item.id, { 
          is_read: true, 
          read_at: new Date().toISOString() 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages'] });
      queryClient.invalidateQueries({ queryKey: ['tenantNotifications'] });
    }
  });

  const handleClick = () => {
    if ((item.type === 'message' && !item.is_read && item.sender_email !== userEmail) ||
        (item.type === 'notification' && !item.is_read)) {
      markAsReadMutation.mutate();
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'notification':
        return <Bell className="w-5 h-5 text-amber-600" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'message':
        return 'Nachricht';
      case 'notification':
        return 'Benachrichtigung';
      case 'announcement':
        return 'Ankündigung';
      default:
        return '';
    }
  };

  const isUnread = (item.type === 'message' && !item.is_read && item.sender_email !== userEmail) ||
                   (item.type === 'notification' && !item.is_read);

  const getContent = () => {
    if (item.type === 'message') return item.message_text;
    if (item.type === 'notification') return item.message;
    if (item.type === 'announcement') return item.content;
    return '';
  };

  const getTitle = () => {
    if (item.type === 'message') return `Von: ${item.sender_email}`;
    if (item.type === 'notification') return item.title;
    if (item.type === 'announcement') return item.title;
    return '';
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${isUnread ? 'border-blue-500 bg-blue-50' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {getTypeLabel()}
              </Badge>
              {isUnread && (
                <Badge className="bg-blue-600 text-white text-xs">
                  Neu
                </Badge>
              )}
              {item.priority && item.priority !== 'normal' && (
                <Badge className={
                  item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-slate-100 text-slate-800'
                }>
                  {item.priority}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{getTitle()}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{getContent()}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              {item.type === 'announcement' && item.author_name && (
                <>
                  <User className="w-3 h-3" />
                  <span>{item.author_name}</span>
                  <span>•</span>
                </>
              )}
              <span>{new Date(item.date).toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}