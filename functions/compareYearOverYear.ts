import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, years } = await req.json();

    if (!form_type || !years || years.length < 2) {
      return Response.json({ 
        error: 'form_type and years (min 2) required' 
      }, { status: 400 });
    }

    console.log(`[YEAR-COMPARISON] Comparing ${form_type} for years ${years.join(', ')}`);

    const comparisons = [];

    for (const year of years) {
      const filters = {
        tax_form_type: form_type,
        tax_year: year
      };

      if (building_id) {
        filters.building_id = building_id;
      }

      const submissions = await base44.entities.ElsterSubmission.filter(filters);

      if (submissions.length > 0) {
        const sub = submissions[0];
        comparisons.push({
          year,
          submission_id: sub.id,
          status: sub.status,
          form_data: sub.form_data || {},
          ai_confidence: sub.ai_confidence_score,
          submitted_at: sub.submission_date
        });
      }
    }

    if (comparisons.length < 2) {
      return Response.json({ 
        error: 'Not enough submissions found for comparison' 
      }, { status: 404 });
    }

    // Analyse Unterschiede
    const analysis = {
      field_changes: {},
      trends: []
    };

    // Extrahiere alle Felder
    const allFields = new Set();
    comparisons.forEach(comp => {
      Object.keys(comp.form_data).forEach(field => allFields.add(field));
    });

    // Vergleiche jedes Feld über die Jahre
    allFields.forEach(field => {
      const values = comparisons.map(comp => ({
        year: comp.year,
        value: comp.form_data[field]
      }));

      const numericValues = values.filter(v => !isNaN(parseFloat(v.value)));
      
      if (numericValues.length >= 2) {
        const firstVal = parseFloat(numericValues[0].value);
        const lastVal = parseFloat(numericValues[numericValues.length - 1].value);
        const change = lastVal - firstVal;
        const changePercent = firstVal !== 0 ? (change / firstVal) * 100 : 0;

        analysis.field_changes[field] = {
          values,
          change,
          change_percent: Math.round(changePercent * 100) / 100,
          trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
        };

        if (Math.abs(changePercent) > 10) {
          analysis.trends.push({
            field,
            trend: change > 0 ? 'increasing' : 'decreasing',
            magnitude: Math.abs(changePercent),
            description: `${field} ${change > 0 ? 'gestiegen' : 'gesunken'} um ${Math.abs(Math.round(changePercent))}%`
          });
        }
      }
    });

    console.log(`[YEAR-COMPARISON] Found ${analysis.trends.length} significant trends`);

    return Response.json({
      success: true,
      comparisons,
      analysis
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});