import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingItems, setPendingItems] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = () => {
    const offlineData = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    setPendingItems(offlineData);
    toast.success(`${offlineData.length} Einträge synchronisiert`);
    localStorage.removeItem('offlineQueue');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
          Offline-Modus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className={isOnline ? 'bg-green-600' : 'bg-red-600'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
        {!isOnline && (
          <p className="text-xs text-slate-600">Ihre Daten werden lokal gespeichert und automatisch synchronisiert, sobald Sie wieder online sind.</p>
        )}
        {isOnline && pendingItems.length > 0 && (
          <Button onClick={syncOfflineData} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            {pendingItems.length} Einträge synchronisieren
          </Button>
        )}
      </CardContent>
    </Card>
  );
}