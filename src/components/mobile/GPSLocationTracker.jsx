import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function GPSLocationTracker() {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (tracking) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => toast.error('GPS-Fehler')
      );
    }
  }, [tracking]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveGPSLocation', { location });
    },
    onSuccess: () => {
      toast.success('Standort gespeichert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          GPS-Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => setTracking(!tracking)} className="w-full">
          {tracking ? 'Stoppen' : 'Tracking starten'}
        </Button>
        {location && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs">Aktuelle Position:</p>
            <Badge className="bg-green-600 font-mono text-xs">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Badge>
            <Button size="sm" className="w-full mt-2" onClick={() => saveMutation.mutate()}>
              Speichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}