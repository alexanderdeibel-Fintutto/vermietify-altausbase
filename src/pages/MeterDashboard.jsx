import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Camera, TrendingUp, Calendar, 
  Building2, Zap, Droplets, Flame, AlertCircle 
} from 'lucide-react';
import MeterOverviewStats from '@/components/meters/MeterOverviewStats';
import MeterConsumptionChart from '@/components/meters/MeterConsumptionChart';
import MeterReadingSchedule from '@/components/meters/MeterReadingSchedule';
import BuildingMeterComparison from '@/components/meters/BuildingMeterComparison';
import MobileMeterScanner from '@/components/meters/MobileMeterScanner';
import MeterQRCodeGenerator from '@/components/meters/MeterQRCodeGenerator';
import BatchMeterScanner from '@/components/meters/BatchMeterScanner';
import TeamMeterCoordination from '@/components/meters/TeamMeterCoordination';
import ConsumptionAnomalyDetector from '@/components/meters/ConsumptionAnomalyDetector';
import OfflineMeterQueue from '@/components/meters/OfflineMeterQueue';
import AdvancedMeterComparison from '@/components/meters/AdvancedMeterComparison';
import MeterDataExportPanel from '@/components/meters/MeterDataExportPanel';

export default function MeterDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedMeterType, setSelectedMeterType] = useState('all');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const { data: allMeters = [] } = useQuery({
    queryKey: ['allMeters'],
    queryFn: () => base44.entities.Meter.list(null, 500)
  });

  const { data: recentReadings = [] } = useQuery({
    queryKey: ['recentReadings'],
    queryFn: async () => {
      const meters = await base44.entities.Meter.filter(
        { last_reading_date: { $ne: null } },
        '-last_reading_date',
        50
      );
      return meters;
    }
  });

  // Filter meters
  const filteredMeters = allMeters.filter(m => {
    const buildingMatch = !selectedBuilding || m.building_id === selectedBuilding;
    const typeMatch = selectedMeterType === 'all' || m.meter_type === selectedMeterType;
    return buildingMatch && typeMatch;
  });

  // Statistics
  const totalMeters = filteredMeters.length;
  const metersWithReadings = filteredMeters.filter(m => m.current_reading).length;
  const readingsThisMonth = recentReadings.filter(m => {
    if (!m.last_reading_date) return false;
    const date = new Date(m.last_reading_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const metersByType = {
    electricity: filteredMeters.filter(m => m.meter_type === 'electricity').length,
    water: filteredMeters.filter(m => m.meter_type === 'water').length,
    gas: filteredMeters.filter(m => m.meter_type === 'gas').length,
    heating: filteredMeters.filter(m => m.meter_type === 'heating').length
  };

  const getMeterIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-600" />;
      case 'gas': return <Flame className="w-5 h-5 text-orange-600" />;
      case 'heating': return <Flame className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Zählerverwaltung</h1>
        <p className="text-slate-600">Übersicht, Erfassung und Auswertung aller Zähler</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Gebäude</label>
              <select
                value={selectedBuilding || ''}
                onChange={(e) => setSelectedBuilding(e.target.value || null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="">Alle Gebäude</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Zählertyp</label>
              <select
                value={selectedMeterType}
                onChange={(e) => setSelectedMeterType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="all">Alle Typen</option>
                <option value="electricity">Strom</option>
                <option value="water">Wasser</option>
                <option value="gas">Gas</option>
                <option value="heating">Heizung</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt Zähler</p>
                <p className="text-2xl font-bold">{totalMeters}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Mit Ablesung</p>
                <p className="text-2xl font-bold">{metersWithReadings}</p>
              </div>
              <Camera className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Diesen Monat</p>
                <p className="text-2xl font-bold">{readingsThisMonth}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ausstehend</p>
                <p className="text-2xl font-bold">{totalMeters - metersWithReadings}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meter Types Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(metersByType).map(([type, count]) => (
          <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedMeterType(type)}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getMeterIcon(type)}
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-slate-600 capitalize">{type}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="scan">Erfassen</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="consumption">Verbrauch</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="schedule">Terminplan</TabsTrigger>
          <TabsTrigger value="qr">QR-Labels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MeterOverviewStats 
            meters={filteredMeters}
            selectedBuilding={selectedBuilding}
          />
        </TabsContent>

        <TabsContent value="scan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <OfflineMeterQueue />
              <MobileMeterScanner buildingId={selectedBuilding} />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Letzte Erfassungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReadings.slice(0, 5).map(meter => (
                    <div key={meter.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getMeterIcon(meter.meter_type)}
                        <div>
                          <p className="font-semibold text-sm">{meter.meter_number}</p>
                          <p className="text-xs text-slate-600">{meter.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{meter.current_reading} {meter.unit}</p>
                        <p className="text-xs text-slate-600">
                          {new Date(meter.last_reading_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch">
          <BatchMeterScanner 
            meters={filteredMeters}
            routeId={null}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamMeterCoordination />
        </TabsContent>

        <TabsContent value="consumption">
          <MeterConsumptionChart 
            meters={filteredMeters}
            selectedBuilding={selectedBuilding}
          />
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-6">
            <ConsumptionAnomalyDetector buildingId={selectedBuilding} />
            <AdvancedMeterComparison buildingId={selectedBuilding} />
            <MeterDataExportPanel buildingId={selectedBuilding} />
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <MeterReadingSchedule 
            meters={filteredMeters}
            buildings={buildings}
          />
        </TabsContent>

        <TabsContent value="qr">
          <MeterQRCodeGenerator buildingId={selectedBuilding} />
        </TabsContent>
      </Tabs>
    </div>
  );
}