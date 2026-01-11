import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Thermometer, Lock, Unlock, Zap, Droplets } from 'lucide-react';

export default function SmartHomeControl({ companyId }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [temperature, setTemperature] = useState([20]);
  const queryClient = useQueryClient();

  const { data: devices = [] } = useQuery({
    queryKey: ['smart-devices', companyId],
    queryFn: () => base44.asServiceRole.entities.SmartDevice.filter({ company_id: companyId })
  });

  const controlMutation = useMutation({
    mutationFn: ({ deviceId, action, value }) =>
      base44.functions.invoke('controlSmartDevice', { device_id: deviceId, action, value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-devices'] })
  });

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'thermostat': return <Thermometer className="w-4 h-4" />;
      case 'smart_lock': return <Lock className="w-4 h-4" />;
      case 'smart_meter': return <Zap className="w-4 h-4" />;
      case 'water_sensor': return <Droplets className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Smart Home Geräte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {devices.map(device => (
            <div key={device.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device.device_type)}
                  <span className="text-sm font-medium">{device.name}</span>
                </div>
                <Badge variant={device.status === 'online' ? 'outline' : 'destructive'}>
                  {device.status}
                </Badge>
              </div>

              {device.device_type === 'thermostat' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Aktuelle Temperatur:</span>
                    <span className="font-bold">{device.current_state?.temperature || 20}°C</span>
                  </div>
                  <Slider
                    value={[device.current_state?.temperature || 20]}
                    onValueChange={(val) => setTemperature(val)}
                    onValueCommit={(val) => 
                      controlMutation.mutate({ deviceId: device.id, action: 'set_temperature', value: val[0] })
                    }
                    min={15}
                    max={25}
                    step={0.5}
                  />
                </div>
              )}

              {device.device_type === 'smart_lock' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={device.current_state?.locked ? 'destructive' : 'default'}
                    onClick={() => controlMutation.mutate({ 
                      deviceId: device.id, 
                      action: device.current_state?.locked ? 'unlock' : 'lock' 
                    })}
                    className="flex-1"
                  >
                    {device.current_state?.locked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                    {device.current_state?.locked ? 'Öffnen' : 'Sperren'}
                  </Button>
                </div>
              )}

              {device.device_type === 'smart_meter' && (
                <div className="text-xs">
                  <p>Verbrauch: {device.current_state?.consumption || 0} kWh</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => controlMutation.mutate({ deviceId: device.id, action: 'read_meter' })}
                    className="mt-2 w-full"
                  >
                    Zählerstand ablesen
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}