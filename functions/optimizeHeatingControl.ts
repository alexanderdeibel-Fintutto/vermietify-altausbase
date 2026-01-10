import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { building_id } = await req.json();

  // Get temperature sensors
  const tempSensors = await base44.asServiceRole.entities.IoTSensor.filter({
    building_id,
    sensor_type: 'temperature',
    is_online: true
  });

  if (tempSensors.length === 0) {
    return Response.json({ error: 'No temperature sensors found' }, { status: 404 });
  }

  // Get weather data (simulated - in production use real weather API)
  const outsideTemp = 5 + Math.random() * 15; // Simulate 5-20°C

  const optimizations = [];
  const targetTemp = 21; // Standard comfort temperature

  for (const sensor of tempSensors) {
    const currentTemp = sensor.current_value || 20;
    const tempDiff = targetTemp - currentTemp;
    
    let action = 'maintain';
    let reason = '';
    let savingsPotential = 0;

    // Decision logic based on temperature and weather
    if (tempDiff > 2) {
      action = 'increase';
      reason = `Temperatur ${tempDiff.toFixed(1)}°C unter Zielwert`;
    } else if (tempDiff < -1 && outsideTemp > 15) {
      action = 'decrease';
      reason = `Überhitzung bei mildem Außenklima (${outsideTemp.toFixed(1)}°C)`;
      savingsPotential = Math.abs(tempDiff) * 2; // Estimated kWh savings
    } else if (currentTemp > 24) {
      action = 'decrease';
      reason = 'Temperatur zu hoch, Energie wird verschwendet';
      savingsPotential = (currentTemp - 22) * 3;
    } else if (outsideTemp > 18 && currentTemp > targetTemp) {
      action = 'decrease';
      reason = 'Außentemperatur ermöglicht natürliche Kühlung';
      savingsPotential = 1.5;
    }

    // Check for maintenance needs
    const readings = await base44.asServiceRole.entities.SensorReading.filter({
      sensor_id: sensor.id
    }, '-timestamp', 50);

    if (readings.length > 10) {
      const recentAvg = readings.slice(0, 10).reduce((sum, r) => sum + r.value, 0) / 10;
      const olderAvg = readings.slice(10, 20).reduce((sum, r) => sum + r.value, 0) / 10;
      
      if (Math.abs(recentAvg - olderAvg) > 3) {
        action = 'schedule_maintenance';
        reason = 'Ungewöhnliche Temperaturschwankungen - Wartung empfohlen';
      }
    }

    const optimization = await base44.asServiceRole.entities.HeatingOptimization.create({
      building_id,
      sensor_id: sensor.id,
      current_temperature: currentTemp,
      target_temperature: targetTemp,
      outside_temperature: outsideTemp,
      recommended_action: action,
      optimization_reason: reason,
      energy_savings_potential: savingsPotential,
      cost_savings_potential: savingsPotential * 0.30,
      implemented: false
    });

    optimizations.push({
      location: sensor.location,
      action,
      reason,
      savings_potential: savingsPotential
    });

    // Create notification for critical actions
    if (action === 'schedule_maintenance') {
      await base44.asServiceRole.entities.BuildingTask.create({
        building_id,
        task_title: `Heizungswartung: ${sensor.location}`,
        description: reason,
        task_type: 'maintenance',
        priority: 'medium',
        status: 'open',
        ai_generated: true
      });
    }
  }

  // Generate comprehensive heating optimization report
  const aiReport = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Analysiere folgende Heizungsoptimierungs-Daten und erstelle einen Bericht:

Gebäude: ${building_id}
Außentemperatur: ${outsideTemp.toFixed(1)}°C
Anzahl Sensoren: ${tempSensors.length}
Optimierungen:
${optimizations.map((o, i) => `${i+1}. ${o.location}: ${o.action} - ${o.reason}`).join('\n')}

Erstelle eine Zusammenfassung mit Handlungsempfehlungen und geschätzten Einsparungen.`,
    response_json_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        total_savings_potential_kwh: { type: 'number' },
        total_savings_potential_euro: { type: 'number' },
        priority_actions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  });

  return Response.json({
    success: true,
    outside_temperature: outsideTemp,
    optimizations_created: optimizations.length,
    total_savings_potential: optimizations.reduce((sum, o) => sum + o.savings_potential, 0),
    ai_report: aiReport,
    details: optimizations
  });
});