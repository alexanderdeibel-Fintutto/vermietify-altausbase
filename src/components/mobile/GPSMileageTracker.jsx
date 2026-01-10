import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Navigation, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function GPSMileageTracker() {
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [lastPosition, setLastPosition] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tracking) return;

    const watchId = navigator.geolocation.watchPosition((position) => {
      if (lastPosition) {
        const newDistance = calculateDistance(
          lastPosition.coords.latitude,
          lastPosition.coords.longitude,
          position.coords.latitude,
          position.coords.longitude
        );
        setDistance(d => d + newDistance);
      }
      setLastPosition(position);
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, lastPosition]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FinancialItem.create({
        name: `Geschäftsfahrt ${new Date().toLocaleDateString('de-DE')}`,
        category: 'Fahrtkosten',
        amount: distance * 0.30,
        tax_deductible: true,
        notes: `${distance.toFixed(2)} km @ 0,30€/km`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success('Fahrt gespeichert');
      setDistance(0);
      setLastPosition(null);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          GPS Fahrtenbuch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">Gefahrene Strecke</p>
          <p className="text-3xl font-bold text-blue-900">{distance.toFixed(2)} km</p>
          <Badge className="mt-2 bg-green-600">{(distance * 0.30).toFixed(2)}€</Badge>
        </div>

        <Button
          onClick={() => setTracking(!tracking)}
          className={tracking ? 'w-full bg-red-600' : 'w-full bg-green-600'}
        >
          {tracking ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Tracking beenden
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Tracking starten
            </>
          )}
        </Button>

        {distance > 0 && !tracking && (
          <Button onClick={() => saveMutation.mutate()} className="w-full">
            Fahrt speichern
          </Button>
        )}
      </CardContent>
    </Card>
  );
}