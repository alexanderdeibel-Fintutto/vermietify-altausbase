import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[SCHEDULED TASK] Starting annual ELSTER form generation...');

    const currentYear = new Date().getFullYear() - 1;

    // Alle aktiven Gebäude
    const buildings = await base44.asServiceRole.entities.Building.filter({ is_active: true });
    
    console.log(`[INFO] Found ${buildings.length} active buildings`);

    let generated = 0;
    const errors = [];

    for (const building of buildings) {
      try {
        // Prüfe ob bereits Submission existiert
        const existing = await base44.asServiceRole.entities.ElsterSubmission.filter({
          building_id: building.id,
          tax_year: currentYear,
          tax_form_type: 'ANLAGE_V'
        });

        if (existing.length > 0) {
          console.log(`[SKIP] Submission for building ${building.id} already exists`);
          continue;
        }

        // Generiere Anlage V
        const response = await base44.asServiceRole.functions.invoke('generateTaxFormWithAI', {
          building_id: building.id,
          form_type: 'ANLAGE_V',
          tax_year: currentYear
        });

        if (response.data.success) {
          generated++;
          console.log(`[SUCCESS] Generated Anlage V for building ${building.id}`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed for building ${building.id}:`, error);
        errors.push({ building_id: building.id, error: error.message });
      }
    }

    console.log(`[COMPLETE] Generated ${generated} forms, ${errors.length} errors`);

    return Response.json({
      success: true,
      generated,
      total: buildings.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[FATAL ERROR] Scheduled task failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});