import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'offline_meter_readings';

export default function OfflineMeterQueue() {
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadQueue();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Online - bereit zum Synchronisieren');
      // Auto-sync on reconnect
      setTimeout(syncQueue, 1000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline - Daten werden lokal gespeichert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Custom event for adding to queue
    const handleAdd = (e) => {
      addToQueue(e.detail);
    };
    window.addEventListener('offline-reading-added', handleAdd);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-reading-added', handleAdd);
    };
  }, []);

  const loadQueue = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  const addToQueue = (reading) => {
    const updated = [...offlineQueue, { ...reading, id: Date.now().toString(), timestamp: Date.now() }];
    setOfflineQueue(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success('Offline gespeichert - wird synchronisiert wenn online');
  };

  const syncQueue = async () => {
    if (!isOnline || offlineQueue.length === 0) {
      return;
    }

    setSyncing(true);
    const results = [];

    for (const reading of offlineQueue) {
      try {
        // Save meter reading
        const savedReading = await base44.entities.MeterReading.create({
          meter_id: reading.meter_id,
          reading_value: reading.reading_value,
          reading_date: reading.reading_date,
          image_url: reading.image_url,
          auto_detected: reading.auto_detected || false,
          confidence_score: reading.confidence_score,
          read_by: (await base44.auth.me()).email,
          voice_notes: reading.voice_notes
        });

        // Update meter
        await base44.entities.Meter.update(reading.meter_id, {
          current_reading: reading.reading_value,
          last_reading_date: reading.reading_date,
          last_reading_by: (await base44.auth.me()).email
        });

        results.push({ success: true, reading: savedReading });
      } catch (error) {
        console.error('Sync failed for reading:', reading, error);
        results.push({ success: false, reading, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedReadings = results.filter(r => !r.success).map(r => r.reading);

    if (failedReadings.length === 0) {
      setOfflineQueue([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success(`✓ ${successCount} Ablesungen synchronisiert`);
    } else {
      setOfflineQueue(failedReadings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failedReadings));
      toast.error(`${failedReadings.length} von ${offlineQueue.length} fehlgeschlagen`);
    }

    setSyncing(false);
  };

  const clearQueue = () => {
    if (confirm('Alle offline Ablesungen löschen?')) {
      setOfflineQueue([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Warteschlange geleert');
    }
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-orange-900">
            {offlineQueue.length} Ablesung(en) warten
          </p>
          {!isOnline && (
            <Badge className="bg-red-600">Offline</Badge>
          )}
        </div>

        <div className="flex gap-2">
          {isOnline && (
            <Button
              onClick={syncQueue}
              disabled={syncing || offlineQueue.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {syncing ? 'Synchronisiere...' : 'Synchronisieren'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={clearQueue}
            disabled={offlineQueue.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {offlineQueue.map((reading, idx) => (
            <div key={reading.id || idx} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
              <div>
                <p className="text-sm font-semibold">{reading.meter_number || 'Unbekannt'}</p>
                <p className="text-xs text-slate-600">
                  {new Date(reading.timestamp).toLocaleString('de-DE')}
                </p>
              </div>
              <span className="text-sm font-bold">{reading.reading_value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to add reading from anywhere
export const addOfflineReading = (reading) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const queue = stored ? JSON.parse(stored) : [];
  const newReading = { ...reading, id: Date.now().toString(), timestamp: Date.now() };
  queue.push(newReading);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  
  // Trigger custom event to update UI
  window.dispatchEvent(new CustomEvent('offline-reading-added', { detail: newReading }));
  
  return newReading;
};