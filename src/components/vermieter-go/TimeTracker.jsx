import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function TimeTracker({ buildingId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((new Date() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const startTracking = () => {
    setStartTime(new Date());
    setIsTracking(true);
    setElapsed(0);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const hours = elapsed / 3600;
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: description || 'Arbeitszeit',
        description: `${formatTime(elapsed)} Stunden`,
        task_type: 'administrative',
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Arbeitszeit gespeichert');
      setIsTracking(false);
      setStartTime(null);
      setElapsed(0);
      setDescription('');
    }
  });

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Zeiterfassung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-blue-600 mb-2">{formatTime(elapsed)}</p>
          {isTracking && (
            <p className="text-sm text-slate-600">Läuft seit {startTime?.toLocaleTimeString('de-DE')}</p>
          )}
        </div>

        {isTracking && (
          <Input
            placeholder="Woran arbeiten Sie?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="flex-1 bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <>
              <Button
                onClick={() => saveMutation.mutate()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Square className="w-4 h-4 mr-2" />
                Stopp & Speichern
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}