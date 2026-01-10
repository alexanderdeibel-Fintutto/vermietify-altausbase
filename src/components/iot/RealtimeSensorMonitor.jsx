import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';

export default function RealtimeSensorMonitor({ buildingId }) {
  const [alerts, setAlerts] = useState([]);

  const { data: sensors = [] } = useQuery({
    queryKey: ['building-sensors', buildingId],
    queryFn: async () => {
      const query = buildingId ? { building_id: buildingId } : {};
      return await base44.entities.IoTSensor.filter(query);
    },
    refetchInterval: 10000
  });

  useEffect(() => {
    const newAlerts = sensors.filter(s => s.status === 'alarm');
    if (newAlerts.length > alerts.length) {
      // New alarm detected
      const notification = new Notification('Sensor-Alarm', {
        body: `${newAlerts[newAlerts.length - 1].sensor_name} hat Alarm ausgelöst`,
        icon: '/icon.png'
      });
    }
    setAlerts(newAlerts);
  }, [sensors]);

  const onlineSensors = sensors.filter(s => s.is_online).length;
  const criticalSensors = sensors.filter(s => s.status === 'alarm').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{sensors.length}</div>
                <div className="text-xs text-slate-600">Sensoren</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-xl font-bold">{onlineSensors}</div>
                <div className="text-xs text-slate-600">Online</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={criticalSensors > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${criticalSensors > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-xl font-bold">{criticalSensors}</div>
                <div className="text-xs text-slate-600">Alarme</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-xl font-bold">
                  {sensors.filter(s => s.status === 'active').length}
                </div>
                <div className="text-xs text-slate-600">Normal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {criticalSensors > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-800">Aktive Alarme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sensors.filter(s => s.status === 'alarm').map(sensor => (
              <div key={sensor.id} className="p-3 bg-white rounded border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{sensor.sensor_name}</p>
                    <p className="text-xs text-slate-600">{sensor.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {sensor.current_value?.toFixed(1)} {sensor.unit}
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(sensor.last_reading_at).toLocaleTimeString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}