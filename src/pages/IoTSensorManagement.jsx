import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Plus, Thermometer, Droplets, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SensorFormDialog from '@/components/iot/SensorFormDialog';
import SensorCard from '@/components/iot/SensorCard';
import SensorDashboard from '@/components/iot/SensorDashboard';

const sensorIcons = {
  temperature: Thermometer,
  humidity: Droplets,
  energy: Zap,
  water: Droplets,
  air_quality: Activity,
  motion: Activity,
  door: Activity,
  smoke: AlertCircle,
  leak: Droplets
};

export default function IoTSensorManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'list'
  const queryClient = useQueryClient();

  const { data: sensors = [] } = useQuery({
    queryKey: ['iot-sensors'],
    queryFn: () => base44.entities.IoTSensor.list(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IoTSensor.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['iot-sensors']);
      toast.success('Sensor gelöscht');
    }
  });

  const activeSensors = sensors.filter(s => s.is_online && s.status === 'active');
  const alarmSensors = sensors.filter(s => s.status === 'alarm');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">IoT Sensoren</h1>
            <p className="text-slate-600">Gebäudeüberwachung in Echtzeit</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            Liste
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Sensor hinzufügen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">{sensors.length}</div>
            <p className="text-slate-600 text-sm">Gesamt Sensoren</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">{activeSensors.length}</div>
            <p className="text-slate-600 text-sm">Online & Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-red-600">{alarmSensors.length}</div>
            <p className="text-slate-600 text-sm">Alarme</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">
              {sensors.filter(s => !s.is_online).length}
            </div>
            <p className="text-slate-600 text-sm">Offline</p>
          </CardContent>
        </Card>
      </div>

      {alarmSensors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                <strong>{alarmSensors.length}</strong> Sensor{alarmSensors.length !== 1 ? 'en' : ''} im Alarm-Status
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'dashboard' ? (
        <SensorDashboard sensors={sensors} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map(sensor => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              onEdit={(s) => {
                setEditingSensor(s);
                setShowForm(true);
              }}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      )}

      {showForm && (
        <SensorFormDialog
          sensor={editingSensor}
          onClose={() => {
            setShowForm(false);
            setEditingSensor(null);
          }}
        />
      )}
    </div>
  );
}