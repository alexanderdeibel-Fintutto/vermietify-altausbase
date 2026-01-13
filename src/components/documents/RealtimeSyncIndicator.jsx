import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle } from 'lucide-react';

export default function RealtimeSyncIndicator({ documentId }) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [syncStatus, setSyncStatus] = useState('connected'); // connected, syncing, error

  const { data: activities = [] } = useQuery({
    queryKey: ['document-activities', documentId],
    queryFn: () => base44.entities.DocumentActivity?.filter?.({ 
      document_id: documentId,
      is_active: true 
    }) || [],
    refetchInterval: 3000 // Poll every 3 seconds
  });

  useEffect(() => {
    // Subscribe to real-time changes
    const unsubscribe = base44.entities.DocumentActivity?.subscribe?.((event) => {
      if (event.data?.document_id === documentId) {
        setSyncStatus('syncing');
        setTimeout(() => setSyncStatus('connected'), 500);
      }
    });

    return () => unsubscribe?.();
  }, [documentId]);

  const uniqueUsers = Array.from(
    new Map(activities.map(a => [a.user_email, a])).values()
  );

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
      <div className="flex items-center gap-2">
        {syncStatus === 'connected' ? (
          <Activity className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-600 animate-pulse" />
        )}
        <span className="text-xs font-medium text-slate-600">
          {syncStatus === 'connected' ? 'Synchronisiert' : 'Synchonisiere...'}
        </span>
      </div>

      {uniqueUsers.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs text-slate-500">Aktiv:</span>
          {uniqueUsers.map(user => (
            <Badge key={user.user_email} variant="outline" className="text-xs">
              {user.user_email.split('@')[0]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}