import React, { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OfflineModeInitializer() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen for online/offline events
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm border-orange-200 bg-orange-50 shadow-lg">
      <WifiOff className="w-4 h-4 text-orange-600" />
      <AlertDescription className="text-orange-800 text-sm">
        📡 Offline-Modus: Sie sind nicht mit dem Internet verbunden. Einige Funktionen sind eingeschränkt.
      </AlertDescription>
    </Alert>
  );
}