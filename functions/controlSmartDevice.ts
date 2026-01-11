import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { device_id, action, value } = await req.json();
    
    const device = await base44.asServiceRole.entities.SmartDevice.read(device_id);
    
    let newState = { ...device.current_state };
    
    switch (action) {
      case 'set_temperature':
        newState.temperature = value;
        // In production: Call actual smart home API
        break;
        
      case 'lock':
        newState.locked = true;
        break;
        
      case 'unlock':
        newState.locked = false;
        break;
        
      case 'read_meter':
        // Fetch current consumption from device
        newState.consumption = value || (newState.consumption || 0) + Math.random() * 10;
        break;
    }
    
    await base44.asServiceRole.entities.SmartDevice.update(device_id, {
      current_state: newState,
      last_reading: new Date().toISOString()
    });
    
    // Log to sensor readings if meter
    if (device.device_type === 'smart_meter') {
      await base44.asServiceRole.entities.SensorReading.create({
        sensor_id: device_id,
        building_id: device.building_id,
        company_id: device.company_id,
        reading_type: 'consumption',
        value: newState.consumption,
        unit: 'kWh',
        timestamp: new Date().toISOString()
      });
    }
    
    return Response.json({ success: true, device: { ...device, current_state: newState } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});