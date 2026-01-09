import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

export default function MeterReadingSchedule({ meters, buildings }) {
  // Calculate next reading dates (every 90 days)
  const getScheduledMeters = () => {
    return meters.map(meter => {
      const lastReading = meter.last_reading_date ? new Date(meter.last_reading_date) : null;
      const nextReading = lastReading 
        ? new Date(lastReading.getTime() + (90 * 24 * 60 * 60 * 1000))
        : new Date();
      
      const daysUntil = Math.ceil((nextReading - new Date()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntil < 0;
      const isDueSoon = daysUntil >= 0 && daysUntil <= 14;

      return {
        ...meter,
        nextReading,
        daysUntil,
        isOverdue,
        isDueSoon,
        priority: isOverdue ? 3 : isDueSoon ? 2 : 1
      };
    }).sort((a, b) => b.priority - a.priority || a.daysUntil - b.daysUntil);
  };

  const scheduledMeters = getScheduledMeters();
  const overdueMeters = scheduledMeters.filter(m => m.isOverdue);
  const dueSoonMeters = scheduledMeters.filter(m => m.isDueSoon);

  // Group by building
  const metersByBuilding = scheduledMeters.reduce((acc, meter) => {
    const buildingId = meter.building_id || 'unknown';
    if (!acc[buildingId]) {
      const building = buildings.find(b => b.id === buildingId);
      acc[buildingId] = {
        name: building?.name || 'Unbekannt',
        meters: []
      };
    }
    acc[buildingId].meters.push(meter);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-900">Überfällig</p>
                <p className="text-3xl font-bold text-red-600">{overdueMeters.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-900">Nächste 14 Tage</p>
                <p className="text-3xl font-bold text-yellow-600">{dueSoonMeters.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-900">Geplant</p>
                <p className="text-3xl font-bold text-green-600">
                  {scheduledMeters.length - overdueMeters.length - dueSoonMeters.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule by Building */}
      {Object.entries(metersByBuilding).map(([buildingId, data]) => (
        <Card key={buildingId}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {data.name}
              <Badge variant="outline">{data.meters.length} Zähler</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.meters.slice(0, 10).map(meter => (
                <div 
                  key={meter.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    meter.isOverdue ? 'bg-red-50 border border-red-200' :
                    meter.isDueSoon ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-slate-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{meter.meter_number}</p>
                      <Badge variant="outline" className="text-xs">
                        {meter.meter_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{meter.location}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      meter.isOverdue ? 'text-red-600' :
                      meter.isDueSoon ? 'text-yellow-600' :
                      'text-slate-900'
                    }`}>
                      {meter.isOverdue 
                        ? `${Math.abs(meter.daysUntil)} Tage überfällig`
                        : meter.isDueSoon
                        ? `In ${meter.daysUntil} Tagen`
                        : meter.nextReading.toLocaleDateString('de-DE')
                      }
                    </p>
                    {meter.last_reading_date && (
                      <p className="text-xs text-slate-500">
                        Letzte: {new Date(meter.last_reading_date).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {data.meters.length > 10 && (
                <p className="text-sm text-slate-600 text-center pt-2">
                  +{data.meters.length - 10} weitere Zähler
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}