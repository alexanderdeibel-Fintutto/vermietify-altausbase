import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Bell, Megaphone, Send, Search, User } from 'lucide-react';
import DirectMessageDialog from '@/components/communication/DirectMessageDialog';
import BroadcastMessageDialog from '@/components/communication/BroadcastMessageDialog';
import InboxMessageCard from '@/components/communication/InboxMessageCard';

export default function TenantCommunicationHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['tenantMessages', user?.email],
    queryFn: () => base44.entities.TenantMessage.filter({ 
      $or: [
        { sender_email: user?.email },
        { recipient_email: user?.email }
      ]
    }, '-created_at', 200),
    enabled: !!user?.email
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenantNotifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ 
      user_email: user?.email 
    }, '-created_date', 100),
    enabled: !!user?.email
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['buildingAnnouncements'],
    queryFn: async () => {
      const posts = await base44.entities.BuildingBoardPost.filter({ 
        post_type: 'announcement',
        is_published: true
      }, '-published_at', 50);
      return posts;
    }
  });

  // Combine all communications
  const allCommunications = [
    ...messages.map(m => ({ ...m, type: 'message', date: m.created_at })),
    ...notifications.map(n => ({ ...n, type: 'notification', date: n.created_date })),
    ...announcements.map(a => ({ ...a, type: 'announcement', date: a.published_at }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredCommunications = allCommunications.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || item.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const unreadMessages = messages.filter(m => !m.is_read && m.sender_email !== user?.email).length;
  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Kommunikationszentrale</h1>
          <p className="text-slate-600 mt-1">Alle Ihre Nachrichten, Benachrichtigungen und Ankündigungen</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Button onClick={() => setShowBroadcast(true)} className="bg-purple-600 hover:bg-purple-700">
              <Megaphone className="w-4 h-4 mr-2" />
              Broadcast senden
            </Button>
          )}
          <Button onClick={() => setShowDirectMessage(true)} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 mr-2" />
            Neue Nachricht
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{unreadMessages}</p>
                <p className="text-sm text-slate-600">Ungelesene Nachrichten</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{unreadNotifications}</p>
                <p className="text-sm text-slate-600">Neue Benachrichtigungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Megaphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{announcements.length}</p>
                <p className="text-sm text-slate-600">Aktuelle Ankündigungen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Nachrichten durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                Alle
              </Button>
              <Button
                variant={filterType === 'message' ? 'default' : 'outline'}
                onClick={() => setFilterType('message')}
                size="sm"
              >
                Nachrichten
              </Button>
              <Button
                variant={filterType === 'notification' ? 'default' : 'outline'}
                onClick={() => setFilterType('notification')}
                size="sm"
              >
                Benachrichtigungen
              </Button>
              <Button
                variant={filterType === 'announcement' ? 'default' : 'outline'}
                onClick={() => setFilterType('announcement')}
                size="sm"
              >
                Ankündigungen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <div className="space-y-3">
        {filteredCommunications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine Kommunikationen gefunden
            </CardContent>
          </Card>
        ) : (
          filteredCommunications.map((item, idx) => (
            <InboxMessageCard key={`${item.type}-${item.id}-${idx}`} item={item} userEmail={user?.email} />
          ))
        )}
      </div>

      {showDirectMessage && (
        <DirectMessageDialog
          onClose={() => setShowDirectMessage(false)}
          userEmail={user?.email}
        />
      )}

      {showBroadcast && (
        <BroadcastMessageDialog
          onClose={() => setShowBroadcast(false)}
          senderEmail={user?.email}
        />
      )}
    </div>
  );
}