import React, { useState } from 'react';
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
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveMileageTrip', { 
        distance,
        purpose: 'Geschäftsfahrt',
        tax_deductible: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Fahrt gespeichert');
      setDistance(0);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          GPS-Kilometer-Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tracking && <Badge className="bg-blue-600 animate-pulse">Tracking aktiv...</Badge>}
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">Gefahrene Kilometer</p>
          <p className="text-3xl font-bold">{distance.toFixed(1)} km</p>
        </div>
        <Button 
          onClick={() => setTracking(!tracking)}
          className="w-full"
          variant={tracking ? 'destructive' : 'default'}
        >
          {tracking ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {tracking ? 'Stoppen' : 'Tracking starten'}
        </Button>
        {distance > 0 && (
          <Button onClick={() => saveMutation.mutate()} variant="outline" className="w-full">
            Fahrt speichern (0,30€/km = {(distance * 0.30).toFixed(2)}€)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}