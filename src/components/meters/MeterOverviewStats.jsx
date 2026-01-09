import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Calendar, MapPin } from 'lucide-react';

export default function MeterOverviewStats({ meters, selectedBuilding }) {
  // Group meters by location
  const metersByLocation = meters.reduce((acc, meter) => {
    const key = meter.location || 'Unbekannt';
    if (!acc[key]) acc[key] = [];
    acc[key].push(meter);
    return acc;
  }, {});

  // Calculate average reading age
  const avgReadingAge = meters.filter(m => m.last_reading_date).reduce((acc, meter) => {
    const days = Math.floor((new Date() - new Date(meter.last_reading_date)) / (1000 * 60 * 60 * 24));
    return acc + days;
  }, 0) / meters.filter(m => m.last_reading_date).length || 0;

  // Meters needing attention (>90 days old or no reading)
  const needsAttention = meters.filter(m => {
    if (!m.last_reading_date) return true;
    const days = Math.floor((new Date() - new Date(m.last_reading_date)) / (1000 * 60 * 60 * 24));
    return days > 90;
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Durchschnittliches Ablese-Alter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(avgReadingAge)} Tage</p>
            <Progress value={Math.min((avgReadingAge / 365) * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              Benötigt Ablesung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{needsAttention.length}</p>
            <p className="text-sm text-slate-600 mt-2">
              {Math.round((needsAttention.length / meters.length) * 100)}% aller Zähler
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              Aktuell erfasst
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {meters.length - needsAttention.length}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Letzte 90 Tage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meters by Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Zähler nach Standort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metersByLocation).map(([location, locationMeters]) => {
              const withReadings = locationMeters.filter(m => m.current_reading).length;
              const percentage = (withReadings / locationMeters.length) * 100;
              
              return (
                <div key={location} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{location}</span>
                      <Badge variant="outline">{locationMeters.length} Zähler</Badge>
                    </div>
                    <span className="text-sm text-slate-600">
                      {withReadings}/{locationMeters.length} erfasst
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Meters Needing Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base text-orange-900">
              Zähler benötigen Ablesung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.slice(0, 10).map(meter => (
                <div key={meter.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <p className="font-semibold text-sm">{meter.meter_number}</p>
                    <p className="text-xs text-slate-600">{meter.location}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    {meter.last_reading_date 
                      ? `${Math.floor((new Date() - new Date(meter.last_reading_date)) / (1000 * 60 * 60 * 24))} Tage`
                      : 'Nie'}
                  </Badge>
                </div>
              ))}
              {needsAttention.length > 10 && (
                <p className="text-sm text-slate-600 text-center pt-2">
                  +{needsAttention.length - 10} weitere
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}