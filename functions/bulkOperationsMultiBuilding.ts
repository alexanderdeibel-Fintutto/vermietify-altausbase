import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      operation, 
      building_ids = [], 
      tax_year, 
      form_type = 'ANLAGE_V' 
    } = await req.json();

    console.log('[BULK-OPS] Operation:', operation, 'Buildings:', building_ids.length);

    let results = [];

    switch (operation) {
      case 'generate_forms':
        for (const buildingId of building_ids) {
          try {
            const response = await base44.functions.invoke('generateTaxFormWithAI', {
              building_id: buildingId,
              form_type,
              tax_year
            });
            results.push({
              building_id: buildingId,
              status: 'success',
              submission_id: response.data.submission_id
            });
          } catch (error) {
            results.push({
              building_id: buildingId,
              status: 'failed',
              error: error.message
            });
          }
        }
        break;

      case 'validate_all':
        const submissions = await base44.entities.ElsterSubmission.filter();
        const toValidate = submissions.filter(s => building_ids.includes(s.building_id));
        
        for (const sub of toValidate) {
          try {
            const validation = await base44.functions.invoke('batchValidateSubmissions', {
              submission_ids: [sub.id]
            });
            results.push({
              submission_id: sub.id,
              valid: validation.data.valid !== false,
              issues: validation.data.total_issues
            });
          } catch (error) {
            results.push({
              submission_id: sub.id,
              status: 'failed'
            });
          }
        }
        break;

      case 'export_datev':
        const exports = [];
        for (const buildingId of building_ids) {
          try {
            const response = await base44.functions.invoke('syncWithDATEV', {
              building_id: buildingId,
              tax_year,
              export_format: 'datev'
            });
            exports.push({
              building_id: buildingId,
              status: 'success'
            });
          } catch (error) {
            exports.push({
              building_id: buildingId,
              status: 'failed'
            });
          }
        }
        results = exports;
        break;
    }

    return Response.json({
      success: true,
      operation,
      total: building_ids.length,
      completed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});