import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year1, year2, building_id } = await req.json();

    console.log(`[COMPARISON] ${year1} vs ${year2}`);

    const year1Subs = await base44.entities.ElsterSubmission.filter({
      tax_year: year1,
      ...(building_id ? { building_id } : {})
    });

    const year2Subs = await base44.entities.ElsterSubmission.filter({
      tax_year: year2,
      ...(building_id ? { building_id } : {})
    });

    const comparison = {
      year1: { year: year1, data: {} },
      year2: { year: year2, data: {} },
      changes: {}
    };

    // Aggregiere Jahr 1
    year1Subs.forEach(sub => {
      if (!sub.form_data) return;
      comparison.year1.data.einnahmen = (comparison.year1.data.einnahmen || 0) + parseFloat(sub.form_data.einnahmen_gesamt || 0);
      comparison.year1.data.ausgaben = (comparison.year1.data.ausgaben || 0) + parseFloat(sub.form_data.werbungskosten_gesamt || 0);
    });

    // Aggregiere Jahr 2
    year2Subs.forEach(sub => {
      if (!sub.form_data) return;
      comparison.year2.data.einnahmen = (comparison.year2.data.einnahmen || 0) + parseFloat(sub.form_data.einnahmen_gesamt || 0);
      comparison.year2.data.ausgaben = (comparison.year2.data.ausgaben || 0) + parseFloat(sub.form_data.werbungskosten_gesamt || 0);
    });

    // Berechne Änderungen
    comparison.changes.einnahmen = {
      absolute: comparison.year2.data.einnahmen - comparison.year1.data.einnahmen,
      percentage: comparison.year1.data.einnahmen > 0 
        ? Math.round(((comparison.year2.data.einnahmen - comparison.year1.data.einnahmen) / comparison.year1.data.einnahmen) * 100)
        : 0
    };

    comparison.changes.ausgaben = {
      absolute: comparison.year2.data.ausgaben - comparison.year1.data.ausgaben,
      percentage: comparison.year1.data.ausgaben > 0 
        ? Math.round(((comparison.year2.data.ausgaben - comparison.year1.data.ausgaben) / comparison.year1.data.ausgaben) * 100)
        : 0
    };

    comparison.year1.data.nettoertrag = comparison.year1.data.einnahmen - comparison.year1.data.ausgaben;
    comparison.year2.data.nettoertrag = comparison.year2.data.einnahmen - comparison.year2.data.ausgaben;
    
    comparison.changes.nettoertrag = {
      absolute: comparison.year2.data.nettoertrag - comparison.year1.data.nettoertrag,
      percentage: comparison.year1.data.nettoertrag > 0 
        ? Math.round(((comparison.year2.data.nettoertrag - comparison.year1.data.nettoertrag) / comparison.year1.data.nettoertrag) * 100)
        : 0
    };

    console.log(`[COMPARISON] Complete`);

    return Response.json({
      success: true,
      comparison
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});