import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { tax_year, form_type = 'ANLAGE_V' } = await req.json();

    if (!tax_year) {
      return Response.json({ error: 'tax_year required' }, { status: 400 });
    }

    console.log(`[BATCH-CREATE] Creating ${form_type} for all buildings, year ${tax_year}`);

    // Hole alle Gebäude
    const buildings = await base44.asServiceRole.entities.Building.list();
    
    if (buildings.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Keine Gebäude gefunden' 
      }, { status: 400 });
    }

    console.log(`[INFO] Found ${buildings.length} buildings`);

    const results = {
      total: buildings.length,
      created: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Erstelle für jedes Gebäude
    for (const building of buildings) {
      try {
        // Prüfe auf Duplikate
        const existing = await base44.asServiceRole.entities.ElsterSubmission.filter({
          building_id: building.id,
          tax_year,
          tax_form_type: form_type
        });

        if (existing.length > 0) {
          console.log(`[SKIP] Building ${building.id} already has submission`);
          results.skipped++;
          results.details.push({
            building_id: building.id,
            building_name: building.address || building.name,
            status: 'skipped',
            reason: 'Submission bereits vorhanden'
          });
          continue;
        }

        // Erstelle neue Submission
        const submission = await base44.asServiceRole.entities.ElsterSubmission.create({
          building_id: building.id,
          tax_form_type: form_type,
          legal_form: 'PRIVATPERSON',
          tax_year,
          submission_mode: 'TEST',
          status: 'DRAFT',
          form_data: {
            address: building.address || building.name,
            property_type: building.property_type || 'Wohngebäude'
          }
        });

        console.log(`[SUCCESS] Created submission for building ${building.id}`);
        results.created++;
        results.details.push({
          building_id: building.id,
          building_name: building.address || building.name,
          submission_id: submission.id,
          status: 'created'
        });

      } catch (error) {
        console.error(`[ERROR] Building ${building.id}:`, error);
        results.errors++;
        results.details.push({
          building_id: building.id,
          building_name: building.address || building.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`[BATCH-CREATE] Complete: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`);

    return Response.json({
      success: true,
      message: `${results.created} Submissions erstellt, ${results.skipped} übersprungen, ${results.errors} Fehler`,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});