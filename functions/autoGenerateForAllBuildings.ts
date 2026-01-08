import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { form_type, tax_year, legal_form } = await req.json();

    if (!form_type || !tax_year || !legal_form) {
      return Response.json({ 
        error: 'form_type, tax_year and legal_form required' 
      }, { status: 400 });
    }

    console.log(`[AUTO-GENERATE-ALL] Starting for ${form_type}, year ${tax_year}`);

    const buildings = await base44.asServiceRole.entities.Building.list();
    
    const results = {
      total: buildings.length,
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const building of buildings) {
      try {
        // Check if submission already exists
        const existing = await base44.asServiceRole.entities.ElsterSubmission.filter({
          building_id: building.id,
          tax_form_type: form_type,
          tax_year
        });

        if (existing.length > 0) {
          results.skipped++;
          continue;
        }

        // Generate with AI
        const response = await base44.asServiceRole.functions.invoke('generateTaxFormWithAI', {
          building_id: building.id,
          form_type,
          tax_year,
          legal_form
        });

        if (response.data?.success) {
          results.created++;
        }
      } catch (error) {
        results.errors.push({ building_id: building.id, error: error.message });
      }
    }

    console.log(`[AUTO-GENERATE-ALL] Complete: ${results.created} created, ${results.skipped} skipped`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});