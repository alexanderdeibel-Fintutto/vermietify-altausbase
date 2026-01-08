import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[ANOMALY-DETECTION] Analyzing ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const formData = sub.form_data || {};
    const anomalies = [];

    // Hole historische Daten für Vergleich
    const historical = await base44.entities.ElsterSubmission.filter({
      building_id: sub.building_id,
      tax_form_type: sub.tax_form_type,
      status: { $in: ['ACCEPTED', 'SUBMITTED'] }
    });

    if (historical.length > 0) {
      // Berechne Durchschnittswerte
      const avgValues = {};
      historical.forEach(hist => {
        Object.entries(hist.form_data || {}).forEach(([key, value]) => {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            if (!avgValues[key]) avgValues[key] = [];
            avgValues[key].push(num);
          }
        });
      });

      Object.keys(avgValues).forEach(key => {
        const values = avgValues[key];
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length);

        const currentValue = parseFloat(formData[key]);
        if (!isNaN(currentValue)) {
          const deviation = Math.abs(currentValue - avg);
          const zScore = stdDev > 0 ? deviation / stdDev : 0;

          if (zScore > 2) {
            anomalies.push({
              field: key,
              current_value: currentValue,
              historical_avg: Math.round(avg),
              deviation: Math.round(deviation),
              z_score: Math.round(zScore * 100) / 100,
              severity: zScore > 3 ? 'HIGH' : 'MEDIUM',
              message: `${key}: ${currentValue} weicht ${Math.round((deviation / avg) * 100)}% vom Durchschnitt ab`
            });
          }
        }
      });
    }

    // Business Rule Anomalies
    const einnahmen = parseFloat(formData.einnahmen_gesamt || 0);
    const ausgaben = parseFloat(formData.ausgaben_gesamt || 0);

    if (ausgaben > einnahmen * 1.5) {
      anomalies.push({
        field: 'ausgaben_gesamt',
        severity: 'HIGH',
        message: 'Ausgaben sind > 150% der Einnahmen. Ungewöhnlich hoch.'
      });
    }

    if (einnahmen > 0 && ausgaben === 0) {
      anomalies.push({
        field: 'ausgaben_gesamt',
        severity: 'MEDIUM',
        message: 'Keine Ausgaben trotz Einnahmen erfasst.'
      });
    }

    console.log(`[ANOMALY-DETECTION] Found ${anomalies.length} anomalies`);

    return Response.json({
      success: true,
      anomalies,
      has_anomalies: anomalies.length > 0
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});