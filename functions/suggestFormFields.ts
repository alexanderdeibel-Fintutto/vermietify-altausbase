import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { field_name, current_value, form_type, building_id, tax_year } = await req.json();

    if (!field_name || !form_type) {
      return Response.json({ error: 'field_name and form_type required' }, { status: 400 });
    }

    console.log(`[SUGGEST] Getting suggestions for field: ${field_name}`);

    // Hole historische Daten für dieses Feld
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      tax_form_type: form_type,
      building_id: building_id || undefined,
      status: { $in: ['ACCEPTED', 'SUBMITTED'] }
    });

    const historicalValues = historicalSubmissions
      .map(s => s.form_data?.[field_name])
      .filter(v => v !== null && v !== undefined);

    // Berechne Statistiken
    const suggestions = {
      field_name,
      current_value,
      historical_values: historicalValues,
      avg_value: null,
      median_value: null,
      most_common: null,
      range: null,
      trend: null,
      confidence: 0
    };

    if (historicalValues.length > 0) {
      // Numerische Werte
      const numericValues = historicalValues.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
      
      if (numericValues.length > 0) {
        suggestions.avg_value = Math.round(numericValues.reduce((a, b) => a + b, 0) / numericValues.length * 100) / 100;
        
        const sorted = [...numericValues].sort((a, b) => a - b);
        suggestions.median_value = sorted[Math.floor(sorted.length / 2)];
        
        suggestions.range = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues)
        };

        // Trend-Analyse (steigend/fallend)
        if (numericValues.length >= 2) {
          const lastTwo = numericValues.slice(-2);
          const trend = lastTwo[1] - lastTwo[0];
          suggestions.trend = trend > 0 ? 'steigend' : trend < 0 ? 'fallend' : 'stabil';
        }

        suggestions.confidence = Math.min(95, 50 + (numericValues.length * 10));
      }

      // String-Werte - häufigster Wert
      const valueCounts = {};
      historicalValues.forEach(v => {
        valueCounts[v] = (valueCounts[v] || 0) + 1;
      });
      
      const mostCommonValue = Object.entries(valueCounts)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (mostCommonValue) {
        suggestions.most_common = {
          value: mostCommonValue[0],
          frequency: mostCommonValue[1]
        };
      }
    }

    // KI-basierte Empfehlung
    if (suggestions.avg_value !== null && current_value) {
      const currentNum = parseFloat(current_value);
      if (!isNaN(currentNum)) {
        const deviation = Math.abs((currentNum - suggestions.avg_value) / suggestions.avg_value * 100);
        
        if (deviation > 20) {
          suggestions.warning = `Ihr Wert weicht um ${Math.round(deviation)}% vom Durchschnitt ab`;
        }
      }
    }

    console.log(`[SUGGEST] Confidence: ${suggestions.confidence}%`);

    return Response.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});