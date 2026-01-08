import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_data, form_type, legal_form, building_id, tax_year } = await req.json();

    if (!form_data || !form_type || !legal_form) {
      return Response.json({ error: 'form_data, form_type and legal_form required' }, { status: 400 });
    }

    console.log(`[INTELLIGENT-VALIDATION] Validating ${form_type}`);

    const validation = {
      is_valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      confidence_score: 100,
      context_checks: {}
    };

    // Hole historische Daten für Kontext
    let historicalData = [];
    if (building_id) {
      historicalData = await base44.entities.ElsterSubmission.filter({
        building_id,
        tax_form_type: form_type,
        status: { $in: ['ACCEPTED', 'SUBMITTED'] }
      });
    }

    // 1. Pflichtfeld-Prüfung
    const requiredFields = {
      ANLAGE_V: ['einnahmen_gesamt', 'werbungskosten_gesamt'],
      EUER: ['betriebseinnahmen', 'betriebsausgaben'],
      GEWERBESTEUER: ['gewinn', 'hinzurechnungen'],
      UMSATZSTEUER: ['umsatz_gesamt', 'vorsteuer']
    };

    const required = requiredFields[form_type] || [];
    required.forEach(field => {
      if (!form_data[field] && form_data[field] !== 0) {
        validation.errors.push({
          field,
          message: `Pflichtfeld fehlt: ${field}`,
          severity: 'HIGH'
        });
        validation.is_valid = false;
      }
    });

    // 2. Numerische Plausibilität
    Object.entries(form_data).forEach(([key, value]) => {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num < 0 && !key.includes('verlust') && !key.includes('ausgaben')) {
          validation.warnings.push({
            field: key,
            message: `Negativer Wert bei ${key}: ${num}`,
            severity: 'MEDIUM'
          });
        }

        if (Math.abs(num) > 10000000) {
          validation.warnings.push({
            field: key,
            message: `Ungewöhnlich hoher Wert bei ${key}: ${num}`,
            severity: 'MEDIUM'
          });
        }
      }
    });

    // 3. Historischer Kontext
    if (historicalData.length > 0) {
      const avgValues = {};
      historicalData.forEach(sub => {
        Object.entries(sub.form_data || {}).forEach(([key, value]) => {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            avgValues[key] = (avgValues[key] || []).concat(num);
          }
        });
      });

      Object.entries(avgValues).forEach(([key, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const currentValue = parseFloat(form_data[key]);

        if (!isNaN(currentValue) && avg > 0) {
          const deviation = Math.abs((currentValue - avg) / avg * 100);
          
          if (deviation > 50) {
            validation.warnings.push({
              field: key,
              message: `${key} weicht ${Math.round(deviation)}% vom historischen Durchschnitt ab`,
              severity: 'LOW'
            });
            validation.suggestions.push({
              field: key,
              suggestion: `Historischer Durchschnitt: ${Math.round(avg)}`,
              confidence: 70
            });
          }
        }
      });

      validation.context_checks.historical_comparison = 'completed';
    }

    // 4. Logische Konsistenz
    if (form_type === 'ANLAGE_V') {
      const einnahmen = parseFloat(form_data.einnahmen_gesamt || 0);
      const ausgaben = parseFloat(form_data.werbungskosten_gesamt || 0);
      const ueberschuss = parseFloat(form_data.ueberschuss || 0);
      
      const calculatedUeberschuss = einnahmen - ausgaben;
      if (Math.abs(ueberschuss - calculatedUeberschuss) > 1) {
        validation.errors.push({
          field: 'ueberschuss',
          message: `Überschuss stimmt nicht: Erwartet ${calculatedUeberschuss}, gefunden ${ueberschuss}`,
          severity: 'HIGH'
        });
        validation.is_valid = false;
      }
    }

    // Berechne Confidence Score
    const errorPenalty = validation.errors.length * 20;
    const warningPenalty = validation.warnings.length * 5;
    validation.confidence_score = Math.max(0, 100 - errorPenalty - warningPenalty);

    console.log(`[INTELLIGENT-VALIDATION] Complete: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);

    return Response.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});