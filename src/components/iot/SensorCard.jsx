import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Zap, Activity, Edit, Trash2, Wifi, WifiOff, Battery } from 'lucide-react';

const sensorIcons = {
  temperature: Thermometer,
  humidity: Droplets,
  energy: Zap,
  water: Droplets,
  air_quality: Activity,
  motion: Activity
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-800',
  alarm: 'bg-red-100 text-red-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  error: 'bg-orange-100 text-orange-800'
};

export default function SensorCard({ sensor, onEdit, onDelete }) {
  const Icon = sensorIcons[sensor.sensor_type] || Activity;

  return (
    <Card className={sensor.status === 'alarm' ? 'border-red-300 border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm">{sensor.sensor_name}</CardTitle>
              <p className="text-xs text-slate-600">{sensor.location}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(sensor)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(sensor.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <div className="text-3xl font-bold">
            {sensor.current_value?.toFixed(1) || '--'}
          </div>
          <div className="text-sm text-slate-600">{sensor.unit}</div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={statusColors[sensor.status]}>
            {sensor.status}
          </Badge>
          {sensor.is_online ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
        </div>

        {sensor.battery_level !== undefined && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Battery className="w-3 h-3" />
            <span>{sensor.battery_level}%</span>
          </div>
        )}

        {sensor.last_reading_at && (
          <div className="text-xs text-slate-600">
            Letzte Messung: {new Date(sensor.last_reading_at).toLocaleString('de-DE')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}