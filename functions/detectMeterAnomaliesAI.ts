import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id } = await req.json();

    // Fetch all meters for building
    const meters = await base44.entities.Meter.filter(
      building_id ? { building_id } : {},
      null,
      500
    );

    // Fetch readings for each meter (last 12 months)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12);

    const allReadings = await base44.entities.MeterReading.filter(
      { meter_id: { $in: meters.map(m => m.id) } },
      '-reading_date',
      2000
    );

    const detectedAnomalies = [];

    // Group readings by meter
    const readingsByMeter = {};
    allReadings.forEach(r => {
      if (!readingsByMeter[r.meter_id]) {
        readingsByMeter[r.meter_id] = [];
      }
      readingsByMeter[r.meter_id].push(r);
    });

    // Analyze each meter with AI
    for (const meter of meters) {
      const readings = readingsByMeter[meter.id] || [];
      if (readings.length < 3) continue;

      const consumptionData = readings
        .sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date))
        .map(r => ({
          date: r.reading_date,
          value: r.reading_value,
          consumption: r.consumption
        }));

      // AI Analysis
      const prompt = `Analysiere diese Verbrauchsdaten eines ${meter.meter_type}-Zählers und identifiziere Anomalien:

ZÄHLER: ${meter.meter_number} - ${meter.location}

DATEN:
${consumptionData.map(d => `${d.date}: Verbrauch ${d.consumption || 'N/A'}, Stand ${d.value}`).join('\n')}

Finde:
1. Ungewöhnlich hohe Verbräuche (>150% vom Durchschnitt)
2. Plötzliche Sprünge
3. Ungewöhnlich niedrige Verbräuche (mögliche Defekte)
4. Unregelmäßige Muster

Antworte nur wenn echte Anomalien gefunden wurden, sonst "none".

JSON Format:
{
  "has_anomalies": true/false,
  "anomalies": [
    {
      "date": "...",
      "type": "high_consumption|sudden_spike|low_consumption|irregular",
      "severity": "low|medium|high|critical",
      "description": "...",
      "recommended_action": "..."
    }
  ]
}`;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            has_anomalies: { type: "boolean" },
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  type: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  recommended_action: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (aiResult.has_anomalies && aiResult.anomalies?.length > 0) {
        detectedAnomalies.push({
          meter_id: meter.id,
          meter_number: meter.meter_number,
          location: meter.location,
          anomalies: aiResult.anomalies
        });

        // Update readings with anomaly flag
        for (const anomaly of aiResult.anomalies) {
          const affectedReading = readings.find(r => 
            r.reading_date.startsWith(anomaly.date.substring(0, 10))
          );
          if (affectedReading) {
            await base44.asServiceRole.entities.MeterReading.update(affectedReading.id, {
              anomaly_detected: true
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      anomalies: detectedAnomalies,
      meters_analyzed: meters.length
    });

  } catch (error) {
    console.error('AI anomaly detection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});