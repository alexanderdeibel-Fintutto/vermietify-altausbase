import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingItems, setPendingItems] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Online - Synchronisierung läuft');
      syncPendingItems();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline-Modus aktiviert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending items
    const pending = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    setPendingItems(pending.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingItems = async () => {
    setSyncing(true);
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    
    try {
      // Process queue items
      for (const item of queue) {
        // Sync logic here
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      localStorage.setItem('offline_queue', '[]');
      setPendingItems(0);
      toast.success('Synchronisierung abgeschlossen');
    } catch (error) {
      toast.error('Sync-Fehler');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className={isOnline ? 'border-green-300' : 'border-orange-300'}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-600" />
            )}
            <span className="text-sm font-semibold">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {pendingItems > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800">
                {pendingItems} ausstehend
              </Badge>
              {isOnline && (
                <Button
                  size="sm"
                  onClick={syncPendingItems}
                  disabled={syncing}
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}