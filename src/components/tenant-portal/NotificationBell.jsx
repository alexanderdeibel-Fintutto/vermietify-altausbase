import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUnreadNotifications, subscribeToNotifications, markNotificationRead, getUnreadCount } from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bell, MessageSquare, FileText, AlertCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    loadUser();
  }, []);
  
  async function loadUser() {
    const u = await base44.auth.me();
    setUser(u);
  }
  
  // Ungelesene Nachrichten zählen
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000
  });
  
  // Notifications laden
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getUnreadNotifications,
    enabled: isOpen
  });
  
  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    
    const subscription = subscribeToNotifications(user.id, () => {
      refetch();
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [user]);
  
  const handleMarkAsRead = async (notificationId) => {
    await markNotificationRead(notificationId);
    refetch();
  };
  
  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'document_shared': return <FileText className="w-5 h-5 text-green-600" />;
      case 'task_created':
      case 'task_updated': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };
  
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden z-50 shadow-xl">
            <div className="p-4 border-b bg-white sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Benachrichtigungen</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Keine neuen Benachrichtigungen</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notif.notification_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{notif.title}</h4>
                          <p className="text-sm text-gray-600">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}