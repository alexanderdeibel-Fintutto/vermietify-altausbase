import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Thermometer, Zap, Droplets, Wind, AlertTriangle, Activity } from 'lucide-react';
import SensorDetailDialog from './SensorDetailDialog';

const sensorIcons = {
  temperature: Thermometer,
  humidity: Droplets,
  energy: Zap,
  water: Droplets,
  air_quality: Wind,
  motion: Activity,
  door: Activity,
  smoke: AlertTriangle,
  leak: Droplets
};

const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-slate-400',
  alarm: 'bg-red-500 animate-pulse',
  maintenance: 'bg-yellow-500',
  error: 'bg-orange-500'
};

export default function InteractiveBuildingMap({ buildingId }) {
  const [selectedSensor, setSelectedSensor] = useState(null);

  const { data: sensors = [] } = useQuery({
    queryKey: ['building-sensors-map', buildingId],
    queryFn: () => base44.entities.IoTSensor.filter({ building_id: buildingId }),
    enabled: !!buildingId,
    refetchInterval: 10000
  });

  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const buildings = await base44.entities.Building.filter({ id: buildingId });
      return buildings[0];
    },
    enabled: !!buildingId
  });

  // Group sensors by location
  const sensorsByLocation = sensors.reduce((acc, sensor) => {
    const location = sensor.location || 'Unbekannt';
    if (!acc[location]) acc[location] = [];
    acc[location].push(sensor);
    return acc;
  }, {});

  const getSensorValue = (sensor) => {
    if (!sensor.current_value) return 'N/A';
    return `${sensor.current_value}${sensor.unit || ''}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gebäudekarte & IoT-Sensoren</CardTitle>
          <p className="text-xs text-slate-600">
            {sensors.length} Sensoren • Klicken für Details
          </p>
        </CardHeader>
        <CardContent>
          {/* Building Floor Plan Visualization */}
          <div className="relative bg-slate-100 rounded-lg p-8 min-h-[500px] border-2 border-slate-200">
            {/* Building outline */}
            <div className="absolute inset-8 border-4 border-slate-300 rounded-lg bg-white">
              {/* Title */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white px-4 py-1 rounded">
                <span className="text-sm font-semibold">{building?.name || 'Gebäude'}</span>
              </div>

              {/* Legend */}
              <div className="absolute -top-4 right-4 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <p className="text-xs font-semibold mb-2">Status</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Aktiv</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Alarm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Wartung</span>
                  </div>
                </div>
              </div>

              {/* Sensor locations */}
              <div className="grid grid-cols-3 gap-4 p-8 h-full">
                {Object.entries(sensorsByLocation).map(([location, locationSensors], idx) => (
                  <div 
                    key={location}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-700 mb-3">{location}</p>
                    <div className="space-y-2">
                      {locationSensors.map(sensor => {
                        const Icon = sensorIcons[sensor.sensor_type] || Activity;
                        return (
                          <button
                            key={sensor.id}
                            onClick={() => setSelectedSensor(sensor)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                              sensor.status === 'alarm' 
                                ? 'border-red-400 bg-red-50' 
                                : sensor.status === 'active'
                                ? 'border-green-400 bg-green-50'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full ${statusColors[sensor.status]} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-xs font-semibold truncate">{sensor.sensor_name}</p>
                              <p className="text-xs text-slate-600 font-mono">{getSensorValue(sensor)}</p>
                            </div>
                            {sensor.status === 'alarm' && (
                              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Statistics overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-4 shadow-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {sensors.filter(s => s.status === 'active').length}
                    </p>
                    <p className="text-xs text-slate-600">Aktiv</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {sensors.filter(s => s.status === 'alarm').length}
                    </p>
                    <p className="text-xs text-slate-600">Alarm</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {sensors.filter(s => s.status === 'maintenance').length}
                    </p>
                    <p className="text-xs text-slate-600">Wartung</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-600">
                      {sensors.filter(s => !s.is_online).length}
                    </p>
                    <p className="text-xs text-slate-600">Offline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Type Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Object.entries(
              sensors.reduce((acc, s) => {
                acc[s.sensor_type] = (acc[s.sensor_type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => {
              const Icon = sensorIcons[type] || Activity;
              return (
                <div key={type} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold">{type}</span>
                  <Badge variant="outline" className="ml-auto">{count}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedSensor && (
        <SensorDetailDialog
          sensor={selectedSensor}
          open={!!selectedSensor}
          onClose={() => setSelectedSensor(null)}
        />
      )}
    </>
  );
}