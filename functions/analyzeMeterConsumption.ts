import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meter_id, months_back = 12 } = await req.json();

    // Fetch historical readings
    const readings = await base44.entities.MeterReading.filter(
      { meter_id },
      '-reading_date',
      months_back
    );

    if (readings.length < 2) {
      return Response.json({
        success: true,
        message: 'Nicht genug Daten für Analyse',
        predictions: null
      });
    }

    // Calculate consumption trends
    const consumptionData = readings.slice(0, -1).map((reading, i) => ({
      date: reading.reading_date,
      consumption: reading.consumption || 0,
      value: reading.reading_value
    }));

    // AI-based analysis and prediction
    const prompt = `Analysiere diese Verbrauchsdaten und erstelle Prognosen:

HISTORISCHE DATEN:
${consumptionData.map(d => `${d.date}: ${d.consumption} (Stand: ${d.value})`).join('\n')}

Analysiere:
1. Verbrauchstrend (steigend/fallend/stabil)
2. Saisonale Muster
3. Anomalien oder Ausreißer
4. Prognose für nächste 3 Monate
5. Empfohlene Maßnahmen

Antworte im JSON-Format:
{
  "trend": "increasing|decreasing|stable",
  "trend_percentage": Prozentuale Änderung,
  "seasonal_pattern": "detected|none",
  "anomalies": [{"date": "...", "reason": "..."}],
  "predictions": [
    {"month": "2026-02", "predicted_consumption": ..., "confidence": 0-1}
  ],
  "recommendations": ["..."],
  "avg_monthly_consumption": Durchschnitt
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          trend: { type: "string" },
          trend_percentage: { type: "number" },
          seasonal_pattern: { type: "string" },
          anomalies: { 
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                month: { type: "string" },
                predicted_consumption: { type: "number" },
                confidence: { type: "number" }
              }
            }
          },
          recommendations: {
            type: "array",
            items: { type: "string" }
          },
          avg_monthly_consumption: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      analysis,
      historical_data: consumptionData
    });

  } catch (error) {
    console.error('Analyze consumption error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});