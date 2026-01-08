import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, source_year, target_year } = await req.json();

    if (!building_id || !form_type || !target_year) {
      return Response.json({ error: 'building_id, form_type, and target_year required' }, { status: 400 });
    }

    console.log(`[AUTO-FILL] Generating predictions for ${target_year}`);

    // Hole historische Daten
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_form_type: form_type,
      status: 'ACCEPTED'
    });

    if (historicalSubmissions.length === 0) {
      return Response.json({ 
        error: 'Keine historischen Daten vorhanden' 
      }, { status: 404 });
    }

    // Sortiere nach Jahr
    const sorted = historicalSubmissions.sort((a, b) => b.tax_year - a.tax_year);
    const lastYear = sorted[0];
    const twoYearsAgo = sorted.find(s => s.tax_year === lastYear.tax_year - 1);
    const threeYearsAgo = sorted.find(s => s.tax_year === lastYear.tax_year - 2);

    // Berechne Trends und Vorhersagen
    const predictions = {};
    const fields = [
      'income_rent',
      'expense_property_tax',
      'expense_insurance',
      'expense_maintenance',
      'expense_administration',
      'expense_interest',
      'afa_amount'
    ];

    fields.forEach(field => {
      const values = [
        lastYear.form_data?.[field] || 0,
        twoYearsAgo?.form_data?.[field] || 0,
        threeYearsAgo?.form_data?.[field] || 0
      ].filter(v => v > 0);

      if (values.length === 0) {
        predictions[field] = {
          predicted_value: 0,
          confidence: 0,
          method: 'no_data'
        };
        return;
      }

      // Durchschnitt der letzten Jahre
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

      // Trend-Berechnung
      let trend = 0;
      if (values.length >= 2) {
        const growth = ((values[0] - values[1]) / values[1]) * 100;
        trend = growth;
      }

      // Vorhersage mit Trend
      const predicted = values[0] * (1 + (trend / 100));

      // Confidence basierend auf Datenmenge und Variabilität
      let confidence = Math.min(values.length * 25, 100);
      
      // Reduziere Confidence bei hoher Volatilität
      const variance = values.reduce((sum, v) => sum + Math.abs(v - avg), 0) / values.length;
      const volatility = (variance / avg) * 100;
      if (volatility > 20) confidence *= 0.8;

      predictions[field] = {
        predicted_value: Math.round(predicted * 100) / 100,
        confidence: Math.round(confidence),
        method: 'trend_analysis',
        trend_percentage: Math.round(trend * 10) / 10,
        historical_avg: Math.round(avg * 100) / 100,
        data_points: values.length
      };
    });

    // Intelligente Anpassungen
    const inflation_rate = 0.03; // 3% geschätzte Inflation
    Object.keys(predictions).forEach(field => {
      if (field.startsWith('expense_')) {
        predictions[field].predicted_value *= (1 + inflation_rate);
        predictions[field].adjusted_for_inflation = true;
      }
    });

    console.log('[SUCCESS] Predictions generated');

    return Response.json({
      success: true,
      predictions,
      source_data: {
        last_year: lastYear.tax_year,
        historical_count: historicalSubmissions.length
      },
      message: `Vorhersagen für ${target_year} basierend auf ${historicalSubmissions.length} Jahren`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});