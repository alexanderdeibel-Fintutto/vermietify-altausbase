import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Zap, Activity, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';

const statusColors = {
  active: 'bg-green-500 text-white',
  inactive: 'bg-slate-500 text-white',
  alarm: 'bg-red-500 text-white',
  maintenance: 'bg-yellow-500 text-white',
  error: 'bg-orange-500 text-white'
};

export default function SensorDetailDialog({ sensor, open, onClose }) {
  const [timeRange, setTimeRange] = useState('24h');

  const { data: readings = [] } = useQuery({
    queryKey: ['sensor-readings', sensor?.id, timeRange],
    queryFn: async () => {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const allReadings = await base44.entities.SensorReading.filter({ 
        sensor_id: sensor.id 
      }, '-timestamp', 1000);
      
      return allReadings
        .filter(r => new Date(r.timestamp) >= startDate)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },
    enabled: !!sensor && open,
    refetchInterval: 30000
  });

  if (!sensor) return null;

  const chartData = readings.map(r => ({
    timestamp: new Date(r.timestamp).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      ...(timeRange !== '24h' && { day: '2-digit', month: '2-digit' })
    }),
    value: r.value,
    isAnomaly: r.is_anomaly
  }));

  const currentValue = sensor.current_value;
  const avgValue = readings.length > 0 
    ? (readings.reduce((sum, r) => sum + r.value, 0) / readings.length).toFixed(2)
    : 'N/A';
  const minValue = readings.length > 0 
    ? Math.min(...readings.map(r => r.value)).toFixed(2)
    : 'N/A';
  const maxValue = readings.length > 0 
    ? Math.max(...readings.map(r => r.value)).toFixed(2)
    : 'N/A';

  const trend = readings.length >= 2
    ? readings[readings.length - 1].value > readings[0].value
    : null;

  const anomalyCount = readings.filter(r => r.is_anomaly).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${statusColors[sensor.status]} flex items-center justify-center`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p>{sensor.sensor_name}</p>
              <p className="text-sm font-normal text-slate-600">
                {sensor.location} • {sensor.sensor_type}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600 mb-1">Aktuell</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentValue}{sensor.unit}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600 mb-1">Durchschnitt</p>
                <p className="text-2xl font-bold text-slate-700">
                  {avgValue}{sensor.unit}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600 mb-1">Min / Max</p>
                <p className="text-lg font-bold text-slate-700">
                  {minValue} / {maxValue}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600 mb-1">Trend</p>
                <div className="flex items-center gap-2">
                  {trend === null ? (
                    <span className="text-sm text-slate-500">-</span>
                  ) : trend ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-semibold text-red-600">Steigend</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-semibold text-green-600">Fallend</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Verlauf</h3>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Stunden</SelectItem>
                <SelectItem value="7d">7 Tage</SelectItem>
                <SelectItem value="30d">30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          <Card>
            <CardContent className="p-6">
              {readings.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Keine Daten für diesen Zeitraum</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      label={{ value: sensor.unit, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sensor Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sensor-Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gerät ID:</span>
                  <span className="font-mono">{sensor.device_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hersteller:</span>
                  <span>{sensor.manufacturer || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Modell:</span>
                  <span>{sensor.model || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <Badge className={statusColors[sensor.status]}>{sensor.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Online:</span>
                  <Badge variant={sensor.is_online ? 'default' : 'secondary'}>
                    {sensor.is_online ? 'Ja' : 'Nein'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Wartung & Alarme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Letzte Ablesung:</span>
                  <span>{sensor.last_reading_at ? new Date(sensor.last_reading_at).toLocaleString('de-DE') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Batterie:</span>
                  <span>{sensor.battery_level ? `${sensor.battery_level}%` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Kalibrierung:</span>
                  <span>{sensor.calibration_date ? new Date(sensor.calibration_date).toLocaleDateString('de-DE') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nächste Wartung:</span>
                  <span>{sensor.next_maintenance ? new Date(sensor.next_maintenance).toLocaleDateString('de-DE') : '-'}</span>
                </div>
                {anomalyCount > 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">{anomalyCount} Anomalien erkannt</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alarm Configuration */}
          {sensor.alarm_config?.enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Alarm-Konfiguration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Min. Schwellwert:</span>
                  <span className="font-semibold">{sensor.alarm_config.min_threshold}{sensor.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Max. Schwellwert:</span>
                  <span className="font-semibold">{sensor.alarm_config.max_threshold}{sensor.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Benachrichtigungen:</span>
                  <span>{sensor.alarm_config.notification_emails?.length || 0} Empfänger</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}