import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[SCHEDULED] Auto-generating tax forms for all buildings');

    const currentYear = new Date().getFullYear() - 1; // Vorjahr

    // Alle aktiven Gebäude laden
    const buildings = await base44.asServiceRole.entities.Building.list();

    let generated = 0;
    let skipped = 0;
    const errors = [];

    for (const building of buildings) {
      try {
        // Prüfe ob bereits Submission für dieses Jahr existiert
        const existing = await base44.asServiceRole.entities.ElsterSubmission.filter({
          building_id: building.id,
          tax_year: currentYear,
          tax_form_type: 'ANLAGE_V'
        });

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // Automatisch generieren
        await base44.asServiceRole.functions.invoke('generateTaxFormWithAI', {
          building_id: building.id,
          form_type: 'ANLAGE_V',
          tax_year: currentYear
        });

        generated++;

      } catch (error) {
        errors.push({ building_id: building.id, error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      generated,
      skipped,
      errors_count: errors.length,
      errors
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});