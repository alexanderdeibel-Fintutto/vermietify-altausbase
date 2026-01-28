import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '../services/messaging';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

export default function RealtimeChatIndicator() {
  const [pulse, setPulse] = useState(false);
  
  const { data: unreadCount = 0, refetch } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: getUnreadCount,
    refetchInterval: 10000
  });
  
  useEffect(() => {
    if (unreadCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);
  
  if (unreadCount === 0) return null;
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${pulse ? 'animate-bounce' : ''}`}>
      <div className="relative">
        <div className="absolute -inset-2 bg-blue-400 rounded-full opacity-25 animate-ping" />
        <Badge className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow-lg flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {unreadCount} neue Nachricht{unreadCount > 1 ? 'en' : ''}
        </Badge>
      </div>
    </div>
  );
}