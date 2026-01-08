import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, field_name } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const sub = subs[0];
    const suggestions = [];

    // Suche ähnliche Submissions
    const similar = await base44.entities.ElsterSubmission.filter({
      building_id: sub.building_id,
      tax_form_type: sub.tax_form_type,
      status: { $in: ['VALIDATED', 'ACCEPTED'] }
    }, '-created_date', 5);

    if (similar.length > 0) {
      const values = similar
        .map(s => s.form_data?.[field_name])
        .filter(v => v !== undefined && v !== null);

      if (values.length > 0) {
        // Häufigster Wert
        const frequency = {};
        values.forEach(v => {
          const key = String(v);
          frequency[key] = (frequency[key] || 0) + 1;
        });

        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
        
        suggestions.push({
          value: sorted[0][0],
          confidence: Math.round((sorted[0][1] / values.length) * 100),
          source: 'historical'
        });
      }
    }

    // Intelligente Standardwerte
    if (field_name === 'finanzamt' && sub.building_id) {
      const buildings = await base44.entities.Building.filter({ id: sub.building_id });
      if (buildings.length > 0 && buildings[0].plz) {
        suggestions.push({
          value: `Finanzamt ${buildings[0].plz.substring(0, 2)}`,
          confidence: 70,
          source: 'smart_default'
        });
      }
    }

    return Response.json({ success: true, suggestions });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});