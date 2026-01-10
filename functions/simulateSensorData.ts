import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get all active sensors
  const sensors = await base44.asServiceRole.entities.IoTSensor.filter({ 
    is_online: true,
    status: { $in: ['active', 'alarm'] }
  });

  const results = [];

  for (const sensor of sensors) {
    let value;
    
    // Generate realistic values based on sensor type
    switch (sensor.sensor_type) {
      case 'temperature':
        value = 18 + Math.random() * 8; // 18-26°C
        break;
      case 'humidity':
        value = 30 + Math.random() * 40; // 30-70%
        break;
      case 'energy':
        value = (sensor.current_value || 0) + Math.random() * 0.5; // Incremental
        break;
      case 'water':
        value = (sensor.current_value || 0) + Math.random() * 10;
        break;
      default:
        value = Math.random() * 100;
    }

    // Process the reading (this will check alarms)
    const result = await base44.asServiceRole.functions.invoke('processSensorReading', {
      sensor_id: sensor.id,
      value,
      timestamp: new Date().toISOString()
    });

    results.push({
      sensor: sensor.sensor_name,
      value,
      alarm: result.data.alarm_triggered
    });
  }

  return Response.json({ 
    success: true,
    readings_processed: results.length,
    alarms_triggered: results.filter(r => r.alarm).length,
    results
  });
});