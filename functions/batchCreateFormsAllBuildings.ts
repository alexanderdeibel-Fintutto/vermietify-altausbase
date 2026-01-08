import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_type, tax_year } = await req.json();

    if (!form_type || !tax_year) {
      return Response.json({ error: 'form_type and tax_year required' }, { status: 400 });
    }

    console.log(`[BATCH CREATE] Creating ${form_type} for all buildings, year ${tax_year}`);

    // Hole alle Gebäude des Users
    const buildings = await base44.entities.Building.list();

    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const building of buildings) {
      try {
        // Prüfe ob bereits Submission existiert
        const existing = await base44.entities.ElsterSubmission.filter({
          building_id: building.id,
          tax_form_type: form_type,
          tax_year
        });

        if (existing.length > 0) {
          results.push({
            building_id: building.id,
            building_name: building.name || building.address,
            status: 'skipped',
            reason: 'Submission already exists'
          });
          skipCount++;
          continue;
        }

        // Erstelle neue Submission mit AI
        const response = await base44.functions.invoke('generateTaxFormWithAI', {
          building_id: building.id,
          form_type,
          tax_year
        });

        if (response.data.success) {
          results.push({
            building_id: building.id,
            building_name: building.name || building.address,
            status: 'success',
            submission_id: response.data.submission_id,
            confidence: response.data.ai_confidence_score
          });
          successCount++;
          console.log(`[SUCCESS] Created for ${building.name || building.address}`);
        } else {
          results.push({
            building_id: building.id,
            building_name: building.name || building.address,
            status: 'failed',
            error: 'Generation failed'
          });
          failCount++;
        }

      } catch (error) {
        results.push({
          building_id: building.id,
          building_name: building.name || building.address,
          status: 'failed',
          error: error.message
        });
        failCount++;
        console.error(`[ERROR] Failed for ${building.id}:`, error.message);
      }
    }

    console.log(`[BATCH COMPLETE] ${successCount} success, ${skipCount} skipped, ${failCount} failed`);

    return Response.json({
      success: true,
      total_buildings: buildings.length,
      success_count: successCount,
      skip_count: skipCount,
      fail_count: failCount,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});