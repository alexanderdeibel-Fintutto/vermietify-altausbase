import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineMeterQueue({ onSync }) {
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('offline_meter_readings');
    if (stored) {
      setOfflineQueue(JSON.parse(stored));
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Verbindung wiederhergestellt');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline-Modus aktiviert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = (reading) => {
    const updated = [...offlineQueue, { ...reading, timestamp: Date.now() }];
    setOfflineQueue(updated);
    localStorage.setItem('offline_meter_readings', JSON.stringify(updated));
    toast.success('Offline gespeichert');
  };

  const syncQueue = async () => {
    if (!isOnline) {
      toast.error('Keine Internetverbindung');
      return;
    }

    setSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const reading of offlineQueue) {
      try {
        await onSync(reading);
        successCount++;
      } catch (error) {
        console.error('Sync failed:', error);
        failCount++;
      }
    }

    if (failCount === 0) {
      setOfflineQueue([]);
      localStorage.removeItem('offline_meter_readings');
      toast.success(`${successCount} Ablesungen synchronisiert`);
    } else {
      toast.error(`${failCount} Fehler bei Synchronisation`);
    }

    setSyncing(false);
  };

  if (offlineQueue.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-orange-600" />
          Offline Warteschlange
          <Badge className="bg-orange-600">{offlineQueue.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-orange-900">
          {offlineQueue.length} Ablesung(en) warten auf Synchronisation
        </p>

        {isOnline && (
          <Button
            onClick={syncQueue}
            disabled={syncing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {syncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
          </Button>
        )}

        <div className="space-y-2">
          {offlineQueue.slice(0, 5).map((reading, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm font-semibold">{reading.meter_number}</span>
              <span className="text-sm">{reading.reading_value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Export function to be used by parent components
export const addOfflineReading = (reading) => {
  const stored = localStorage.getItem('offline_meter_readings');
  const queue = stored ? JSON.parse(stored) : [];
  queue.push({ ...reading, timestamp: Date.now() });
  localStorage.setItem('offline_meter_readings', JSON.stringify(queue));
};