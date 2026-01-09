import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, History, Building2, TrendingUp, Zap } from 'lucide-react';
import MobileMeterScanner from '@/components/meters/MobileMeterScanner';

export default function MobileMeterScanning() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeTab, setActiveTab] = useState('scan');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const { data: meters = [] } = useQuery({
    queryKey: ['meters', selectedBuilding],
    queryFn: () => base44.entities.Meter.filter(
      selectedBuilding ? { building_id: selectedBuilding } : {},
      'location',
      200
    )
  });

  const { data: recentReadings = [] } = useQuery({
    queryKey: ['recentReadings'],
    queryFn: async () => {
      const allMeters = await base44.entities.Meter.filter(
        { last_reading_date: { $ne: null } },
        '-last_reading_date',
        20
      );
      return allMeters;
    }
  });

  const totalMeters = meters.length;
  const metersWithReadings = meters.filter(m => m.current_reading).length;
  const readingsToday = recentReadings.filter(m => {
    if (!m.last_reading_date) return false;
    const today = new Date().toISOString().split('T')[0];
    const readingDate = new Date(m.last_reading_date).toISOString().split('T')[0];
    return readingDate === today;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">Zählererfassung</h1>
          <p className="text-sm text-blue-100">Schnell und einfach mit der Kamera</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{totalMeters}</p>
              <p className="text-xs text-blue-100">Gesamt</p>
            </div>
            <div className="bg-green-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{readingsToday}</p>
              <p className="text-xs text-blue-100">Heute</p>
            </div>
            <div className="bg-blue-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{metersWithReadings}</p>
              <p className="text-xs text-blue-100">Erfasst</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">
              <Camera className="w-4 h-4 mr-2" />
              Scannen
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Verlauf
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            {/* Building Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Gebäude wählen (optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={!selectedBuilding ? 'default' : 'outline'}
                    onClick={() => setSelectedBuilding(null)}
                    className="justify-start"
                  >
                    Alle Gebäude
                  </Button>
                  {buildings.map(building => (
                    <Button
                      key={building.id}
                      variant={selectedBuilding === building.id ? 'default' : 'outline'}
                      onClick={() => setSelectedBuilding(building.id)}
                      className="justify-start"
                    >
                      {building.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scanner Component */}
            <MobileMeterScanner 
              buildingId={selectedBuilding}
              onComplete={() => {
                // Refresh data after successful scan
              }}
            />

            {/* Quick Stats */}
            {selectedBuilding && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zähler in diesem Gebäude</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {meters.slice(0, 5).map(meter => (
                      <div key={meter.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <p className="font-semibold text-sm">{meter.meter_number}</p>
                          <p className="text-xs text-slate-600">{meter.location}</p>
                        </div>
                        <Badge variant="outline">
                          {meter.meter_type}
                        </Badge>
                      </div>
                    ))}
                    {meters.length > 5 && (
                      <p className="text-xs text-slate-600 text-center pt-2">
                        +{meters.length - 5} weitere
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {recentReadings.map(meter => (
              <Card key={meter.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{meter.meter_number}</p>
                      <p className="text-sm text-slate-600">{meter.location}</p>
                    </div>
                    <Badge variant="outline">{meter.meter_type}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{meter.current_reading}</span>
                      <span className="text-slate-600">{meter.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(meter.last_reading_date).toLocaleDateString('de-DE')}
                    </div>
                    {meter.last_reading_by && (
                      <div className="text-xs text-slate-500 ml-auto">
                        von {meter.last_reading_by.split('@')[0]}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {recentReadings.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-slate-600">
                  <History className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p>Noch keine Ablesungen</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}