import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { sensor_id, value, timestamp = new Date().toISOString() } = await req.json();

  // Get sensor configuration
  const sensor = await base44.asServiceRole.entities.IoTSensor.filter({ 
    id: sensor_id 
  }).then(s => s[0]);

  if (!sensor) {
    return Response.json({ error: 'Sensor not found' }, { status: 404 });
  }

  let alarm_triggered = false;
  let is_anomaly = false;

  // Check thresholds if alarm is enabled
  if (sensor.alarm_config?.enabled) {
    const { min_threshold, max_threshold } = sensor.alarm_config;
    
    if ((min_threshold !== null && value < min_threshold) || 
        (max_threshold !== null && value > max_threshold)) {
      alarm_triggered = true;
      
      // Update sensor status
      await base44.asServiceRole.entities.IoTSensor.update(sensor_id, {
        status: 'alarm',
        current_value: value,
        last_reading_at: timestamp
      });

      // Trigger alarm workflow
      await base44.asServiceRole.functions.invoke('triggerSensorAlarmWorkflow', {
        sensor_id,
        value,
        threshold_type: value < min_threshold ? 'below_min' : 'above_max',
        threshold_value: value < min_threshold ? min_threshold : max_threshold
      });
    } else {
      // Normal reading, update sensor status if it was in alarm
      if (sensor.status === 'alarm') {
        await base44.asServiceRole.entities.IoTSensor.update(sensor_id, {
          status: 'active'
        });
      }
      
      await base44.asServiceRole.entities.IoTSensor.update(sensor_id, {
        current_value: value,
        last_reading_at: timestamp
      });
    }
  } else {
    // Just update current value
    await base44.asServiceRole.entities.IoTSensor.update(sensor_id, {
      current_value: value,
      last_reading_at: timestamp
    });
  }

  // Store reading
  const reading = await base44.asServiceRole.entities.SensorReading.create({
    sensor_id,
    value,
    timestamp,
    unit: sensor.unit,
    alarm_triggered,
    is_anomaly
  });

  return Response.json({ 
    success: true,
    reading_id: reading.id,
    alarm_triggered,
    sensor_status: alarm_triggered ? 'alarm' : 'active'
  });
});