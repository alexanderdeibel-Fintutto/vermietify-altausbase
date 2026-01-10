import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';

export default function OfflineSyncManager() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
          Offline-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status</span>
          <Badge className={isOnline ? 'bg-green-600' : 'bg-orange-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <p className="text-xs text-slate-600">
          Ihre Daten werden automatisch synchronisiert, sobald Sie wieder online sind.
        </p>
        <Button className="w-full" disabled={!isOnline}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Jetzt synchronisieren
        </Button>
      </CardContent>
    </Card>
  );
}