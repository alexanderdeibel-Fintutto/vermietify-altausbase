import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

export default function SensorDashboard({ sensors }) {
  const temperatureSensors = sensors.filter(s => s.sensor_type === 'temperature');
  const humiditySensors = sensors.filter(s => s.sensor_type === 'humidity');
  const energySensors = sensors.filter(s => s.sensor_type === 'energy');

  const { data: recentReadings = [] } = useQuery({
    queryKey: ['sensor-readings-recent'],
    queryFn: async () => {
      const readings = await base44.entities.SensorReading.list('-timestamp', 100);
      return readings;
    },
    refetchInterval: 30000
  });

  const getChartData = (sensorType) => {
    const sensorIds = sensors.filter(s => s.sensor_type === sensorType).map(s => s.id);
    return recentReadings
      .filter(r => sensorIds.includes(r.sensor_id))
      .slice(0, 20)
      .reverse()
      .map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        value: r.value
      }));
  };

  const tempData = getChartData('temperature');
  const humidityData = getChartData('humidity');
  const energyData = getChartData('energy');

  const avgTemp = temperatureSensors.length > 0
    ? temperatureSensors.reduce((sum, s) => sum + (s.current_value || 0), 0) / temperatureSensors.length
    : 0;

  const totalEnergy = energySensors.reduce((sum, s) => sum + (s.current_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Durchschnittstemperatur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTemp.toFixed(1)}°C</div>
            <p className="text-xs text-slate-600">{temperatureSensors.length} Sensoren</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ø Luftfeuchtigkeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {humiditySensors.length > 0
                ? (humiditySensors.reduce((sum, s) => sum + (s.current_value || 0), 0) / humiditySensors.length).toFixed(1)
                : '0'}%
            </div>
            <p className="text-xs text-slate-600">{humiditySensors.length} Sensoren</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Energieverbrauch (gesamt)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnergy.toFixed(2)} kWh</div>
            <p className="text-xs text-slate-600">{energySensors.length} Sensoren</p>
          </CardContent>
        </Card>
      </div>

      {tempData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Temperaturverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tempData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {energyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Energieverbrauch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}