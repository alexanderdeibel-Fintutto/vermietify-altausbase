import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const sensorTypes = [
  { value: 'temperature', label: 'Temperatur', unit: '°C' },
  { value: 'humidity', label: 'Luftfeuchtigkeit', unit: '%' },
  { value: 'energy', label: 'Energieverbrauch', unit: 'kWh' },
  { value: 'water', label: 'Wasserverbrauch', unit: 'L' },
  { value: 'air_quality', label: 'Luftqualität', unit: 'ppm' },
  { value: 'motion', label: 'Bewegung', unit: '' },
  { value: 'door', label: 'Tür/Fenster', unit: '' },
  { value: 'smoke', label: 'Rauchmelder', unit: '' },
  { value: 'leak', label: 'Wasserleck', unit: '' }
];

export default function SensorFormDialog({ sensor, onClose }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState(sensor || {
    sensor_name: '',
    sensor_type: 'temperature',
    device_id: '',
    building_id: '',
    location: '',
    manufacturer: '',
    model: '',
    unit: '°C',
    status: 'active',
    is_online: true,
    alarm_config: {
      enabled: false,
      min_threshold: null,
      max_threshold: null,
      notification_emails: []
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (sensor?.id) {
        await base44.entities.IoTSensor.update(sensor.id, formData);
      } else {
        await base44.entities.IoTSensor.create(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['iot-sensors']);
      toast.success(sensor ? 'Sensor aktualisiert' : 'Sensor erstellt');
      onClose();
    }
  });

  const handleTypeChange = (type) => {
    const typeData = sensorTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      sensor_type: type,
      unit: typeData?.unit || ''
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sensor ? 'Sensor bearbeiten' : 'Neuer Sensor'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Sensor-Name</label>
              <Input
                value={formData.sensor_name}
                onChange={(e) => setFormData({ ...formData, sensor_name: e.target.value })}
                placeholder="z.B. Heizraum Temperatur"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Sensor-Typ</label>
              <Select value={formData.sensor_type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Geräte-ID</label>
              <Input
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                placeholder="Hardware-ID"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Gebäude</label>
              <Select
                value={formData.building_id}
                onValueChange={(value) => setFormData({ ...formData, building_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude wählen" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(building => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Standort im Gebäude</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="z.B. Heizraum, Keller, Wohnung 12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Hersteller</label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Modell</label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Alarm-Konfiguration</h3>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-3">
              <span className="text-sm">Alarme aktivieren</span>
              <Switch
                checked={formData.alarm_config?.enabled}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  alarm_config: { ...formData.alarm_config, enabled: checked }
                })}
              />
            </div>

            {formData.alarm_config?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Min. Schwellwert</label>
                  <Input
                    type="number"
                    value={formData.alarm_config?.min_threshold || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      alarm_config: {
                        ...formData.alarm_config,
                        min_threshold: parseFloat(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Max. Schwellwert</label>
                  <Input
                    type="number"
                    value={formData.alarm_config?.max_threshold || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      alarm_config: {
                        ...formData.alarm_config,
                        max_threshold: parseFloat(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.sensor_name || !formData.device_id || !formData.building_id}
            >
              Speichern
            </Button>
            <Button onClick={onClose} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}