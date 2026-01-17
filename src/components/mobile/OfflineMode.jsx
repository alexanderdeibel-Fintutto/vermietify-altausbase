import React, { useState, useEffect } from 'react';
import { WifiOff, CloudOff } from 'lucide-react';
import { useLocalStorage } from '@/components/hooks/useLocalStorage';

export default function OfflineMode({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useLocalStorage('offline-queue', []);

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

  if (!isOnline) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center py-12">
          <CloudOff className="h-16 w-16 mx-auto mb-4 text-[var(--theme-text-muted)]" />
          <h2 className="text-xl font-semibold mb-2">Offline-Modus</h2>
          <p className="text-[var(--theme-text-secondary)]">
            Sie sind offline. Einige Funktionen sind eingeschränkt.
          </p>
          {offlineQueue.length > 0 && (
            <div className="mt-4 p-4 bg-[var(--vf-warning-50)] rounded-lg">
              <WifiOff className="h-5 w-5 mx-auto mb-2 text-[var(--vf-warning-600)]" />
              <p className="text-sm text-[var(--vf-warning-700)]">
                {offlineQueue.length} Aktionen warten auf Synchronisation
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}