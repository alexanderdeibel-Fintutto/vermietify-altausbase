import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { WifiOff, Upload } from 'lucide-react';

export default function OfflineMode() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          Offline-Modus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status</span>
          <Badge className={isOnline ? 'bg-green-600' : 'bg-red-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {pendingSync.length > 0 && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-semibold text-orange-900">
              {pendingSync.length} Einträge warten auf Synchronisation
            </p>
            {isOnline && (
              <Button size="sm" className="mt-2 w-full">
                <Upload className="w-4 h-4 mr-2" />
                Jetzt synchronisieren
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}