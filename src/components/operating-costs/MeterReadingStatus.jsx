import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Gauge } from 'lucide-react';

export default function MeterReadingStatus({ unitIds, periodStart, periodEnd }) {
  const { data: meters = [] } = useQuery({
    queryKey: ['meters', unitIds],
    queryFn: async () => {
      const allMeters = await base44.entities.Meter.list();
      return allMeters.filter(m => unitIds.includes(m.unit_id));
    },
    enabled: unitIds?.length > 0
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['meterReadings', meters],
    queryFn: async () => {
      if (meters.length === 0) return [];
      const allReadings = await base44.entities.MeterReading.list();
      return allReadings.filter(r => meters.some(m => m.id === r.meter_id));
    },
    enabled: meters.length > 0
  });

  const heatingMeters = meters.filter(m => m.zaehler_typ === 'Heizung' || m.zaehler_typ === 'W€rmemenge');
  const waterMeters = meters.filter(m => m.zaehler_typ === 'Wasser warm');

  const getReadingStatus = (meter) => {
    const meterReadings = readings.filter(r => r.meter_id === meter.id);
    const hasStart = meterReadings.some(r => r.ablesedatum <= periodStart);
    const hasEnd = meterReadings.some(r => r.ablesedatum >= periodEnd);
    return hasStart && hasEnd ? 'complete' : 'incomplete';
  };

  const completeMeters = [...heatingMeters, ...waterMeters].filter(m => getReadingStatus(m) === 'complete');
  const totalMeters = heatingMeters.length + waterMeters.length;

  if (totalMeters === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Keine Heiz-/Warmwasserzähler erfasst</p>
              <p className="text-xs text-gray-600">
                HeizkostenV-Kosten werden nach Wohnfläche verteilt (Fallback-Methode)
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={completeMeters.length === totalMeters ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {completeMeters.length === totalMeters ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4" />
              <p className="font-semibold text-sm">Zählerstände-Status</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {completeMeters.length} / {totalMeters} vollständig
              </Badge>
              <span className="text-xs text-gray-600">
                ({heatingMeters.length} Heizung, {waterMeters.length} Warmwasser)
              </span>
            </div>
            {completeMeters.length < totalMeters && (
              <p className="text-xs text-gray-600 mt-2">
                ⚠️ Fehlende Zählerstände führen zu Verteilung nach Wohnfläche
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}