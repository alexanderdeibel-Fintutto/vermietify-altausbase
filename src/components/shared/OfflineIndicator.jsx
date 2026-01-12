import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, Clock } from 'lucide-react';
import { useOfflineQueue } from './OfflineQueueManager';

export default function OfflineIndicator() {
  const { isOnline, queueSize, processQueue } = useOfflineQueue();

  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOnline ? (
        <Badge className="bg-red-600 text-white px-4 py-2 shadow-lg">
          <WifiOff className="w-4 h-4 mr-2" />
          Offline-Modus
        </Badge>
      ) : queueSize > 0 ? (
        <Button
          onClick={processQueue}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 shadow-lg"
        >
          <Clock className="w-4 h-4 mr-2" />
          {queueSize} ausstehende Aktion{queueSize !== 1 ? 'en' : ''}
        </Button>
      ) : null}
    </div>
  );
}