import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { building_id, period = 'monthly', days = 30 } = await req.json();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get energy sensors for the building
  const energySensors = await base44.asServiceRole.entities.IoTSensor.filter({
    building_id,
    sensor_type: 'energy',
    is_online: true
  });

  if (energySensors.length === 0) {
    return Response.json({ 
      error: 'No energy sensors found',
      building_id,
      message: 'Install energy sensors to enable analysis'
    }, { status: 404 });
  }

  // Get all readings for the period
  const allReadings = [];
  for (const sensor of energySensors) {
    const readings = await base44.asServiceRole.entities.SensorReading.filter({
      sensor_id: sensor.id,
      timestamp: { $gte: startDate.toISOString() }
    });
    allReadings.push(...readings);
  }

  if (allReadings.length === 0) {
    return Response.json({ 
      error: 'No readings available',
      message: 'Not enough data for analysis'
    }, { status: 404 });
  }

  // Calculate statistics
  const values = allReadings.map(r => r.value);
  const totalConsumption = values.reduce((sum, v) => sum + v, 0);
  const avgConsumption = totalConsumption / values.length;
  const peakConsumption = Math.max(...values);

  // Detect patterns
  const hourlyData = {};
  allReadings.forEach(r => {
    const hour = new Date(r.timestamp).getHours();
    if (!hourlyData[hour]) hourlyData[hour] = [];
    hourlyData[hour].push(r.value);
  });

  const hourlyAvg = Object.entries(hourlyData).map(([hour, vals]) => ({
    hour: parseInt(hour),
    avg: vals.reduce((sum, v) => sum + v, 0) / vals.length
  }));

  hourlyAvg.sort((a, b) => b.avg - a.avg);
  const peakHours = hourlyAvg.slice(0, 3).map(h => h.hour);
  const lowHours = hourlyAvg.slice(-3).map(h => h.hour);

  // Weekday vs Weekend
  const weekdayReadings = allReadings.filter(r => {
    const day = new Date(r.timestamp).getDay();
    return day >= 1 && day <= 5;
  });
  const weekendReadings = allReadings.filter(r => {
    const day = new Date(r.timestamp).getDay();
    return day === 0 || day === 6;
  });

  const weekdayAvg = weekdayReadings.length > 0 
    ? weekdayReadings.reduce((sum, r) => sum + r.value, 0) / weekdayReadings.length 
    : 0;
  const weekendAvg = weekendReadings.length > 0
    ? weekendReadings.reduce((sum, r) => sum + r.value, 0) / weekendReadings.length
    : 0;

  // Anomaly detection (simple threshold-based)
  const anomalies = [];
  const threshold = avgConsumption * 1.5; // 50% above average
  
  allReadings.forEach(reading => {
    if (reading.value > threshold) {
      const deviation = ((reading.value - avgConsumption) / avgConsumption) * 100;
      anomalies.push({
        timestamp: reading.timestamp,
        value: reading.value,
        expected_value: avgConsumption,
        deviation_percent: deviation.toFixed(1),
        severity: deviation > 100 ? 'critical' : deviation > 50 ? 'high' : 'medium',
        description: `Verbrauch ${deviation.toFixed(0)}% über Durchschnitt`
      });
    }
  });

  // AI-powered insights using LLM
  const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Analysiere folgende Energieverbrauchsdaten und gebe konkrete Handlungsempfehlungen:
    
Gebäude-ID: ${building_id}
Zeitraum: ${days} Tage
Gesamtverbrauch: ${totalConsumption.toFixed(2)} kWh
Durchschnitt: ${avgConsumption.toFixed(2)} kWh
Spitze: ${peakConsumption.toFixed(2)} kWh
Spitzenstunden: ${peakHours.join(', ')} Uhr
Schwache Stunden: ${lowHours.join(', ')} Uhr
Anomalien erkannt: ${anomalies.length}

Gebe eine Liste mit 5-7 konkreten, umsetzbaren Empfehlungen zur Energieeinsparung.`,
    response_json_schema: {
      type: 'object',
      properties: {
        insights: {
          type: 'array',
          items: { type: 'string' }
        },
        savings_potential_kwh: { type: 'number' },
        savings_potential_euro: { type: 'number' },
        efficiency_score: { type: 'number' }
      }
    }
  });

  const aiInsights = aiResponse.insights || [];
  const savingsPotentialKwh = aiResponse.savings_potential_kwh || totalConsumption * 0.15;
  const savingsPotentialEuro = aiResponse.savings_potential_euro || savingsPotentialKwh * 0.30;
  const efficiencyScore = aiResponse.efficiency_score || 70;

  // Create analysis record
  const analysis = await base44.asServiceRole.entities.EnergyAnalysis.create({
    building_id,
    analysis_period: period,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    total_consumption: totalConsumption,
    average_consumption: avgConsumption,
    peak_consumption: peakConsumption,
    consumption_patterns: {
      peak_hours: peakHours,
      low_hours: lowHours,
      weekday_avg: weekdayAvg,
      weekend_avg: weekendAvg
    },
    anomalies_detected: anomalies.slice(0, 10),
    savings_potential: {
      estimated_savings_kwh: savingsPotentialKwh,
      estimated_savings_euro: savingsPotentialEuro,
      recommendations: aiInsights
    },
    efficiency_score: efficiencyScore,
    comparison_to_baseline: 0,
    ai_insights: aiInsights
  });

  return Response.json({
    success: true,
    analysis_id: analysis.id,
    summary: {
      total_consumption: totalConsumption,
      anomalies_count: anomalies.length,
      savings_potential_euro: savingsPotentialEuro,
      efficiency_score: efficiencyScore
    },
    insights: aiInsights
  });
});