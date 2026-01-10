import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Thermometer, Droplets, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IoTSensorsPanel({ buildingId }) {
  const { data: sensors = [] } = useQuery({
    queryKey: ['building-sensors', buildingId],
    queryFn: () => base44.entities.IoTSensor.filter({ building_id: buildingId }),
    refetchInterval: 30000,
    enabled: !!buildingId
  });

  const alarmCount = sensors.filter(s => s.status === 'alarm').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            IoT Sensoren
          </CardTitle>
          <Link to={createPageUrl('IoTSensorManagement')}>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
              Alle Sensoren →
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sensors.length === 0 ? (
          <p className="text-slate-600 text-center py-4">Keine Sensoren installiert</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-xl font-bold">{sensors.length}</div>
                <div className="text-xs text-slate-600">Gesamt</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-xl font-bold text-green-600">
                  {sensors.filter(s => s.is_online).length}
                </div>
                <div className="text-xs text-slate-600">Online</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="text-xl font-bold text-red-600">{alarmCount}</div>
                <div className="text-xs text-slate-600">Alarme</div>
              </div>
            </div>

            <div className="space-y-2">
              {sensors.slice(0, 5).map(sensor => {
                const Icon = sensor.sensor_type === 'temperature' ? Thermometer :
                           sensor.sensor_type === 'humidity' ? Droplets :
                           sensor.sensor_type === 'energy' ? Zap : Activity;
                
                return (
                  <div key={sensor.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium">{sensor.sensor_name}</p>
                        <p className="text-xs text-slate-600">{sensor.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {sensor.current_value?.toFixed(1) || '--'} {sensor.unit}
                      </p>
                      {sensor.status === 'alarm' && (
                        <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}