import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function GPSLocationTracker() {
  const [location, setLocation] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveGPSLocation', { 
        latitude: location.latitude,
        longitude: location.longitude
      });
    },
    onSuccess: () => {
      toast.success('Standort gespeichert');
    }
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          GPS-Standort
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {location && (
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-xs">Lat: {location.latitude.toFixed(6)}</p>
            <p className="text-xs">Lng: {location.longitude.toFixed(6)}</p>
          </div>
        )}
        <Button onClick={getLocation} className="w-full">
          Standort erfassen
        </Button>
        {location && (
          <Button onClick={() => saveMutation.mutate()} variant="outline" className="w-full">
            Standort speichern
          </Button>
        )}
      </CardContent>
    </Card>
  );
}