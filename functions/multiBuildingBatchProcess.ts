import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_ids, operation, params } = await req.json();

    console.log(`[MULTI-BATCH] Processing ${operation} for ${building_ids.length} buildings`);

    const results = { success: [], failed: [], total: building_ids.length };

    for (const building_id of building_ids) {
      try {
        let result;

        switch (operation) {
          case 'generate':
            const response = await base44.functions.invoke('generateTaxFormWithAI', {
              building_id,
              form_type: params.form_type,
              tax_year: params.tax_year
            });
            result = response.data;
            break;

          case 'validate':
            const subs = await base44.entities.ElsterSubmission.filter({ building_id });
            for (const sub of subs) {
              await base44.functions.invoke('validateFormPlausibility', { submission_id: sub.id });
            }
            result = { validated: subs.length };
            break;

          case 'export':
            const submissions = await base44.entities.ElsterSubmission.filter({ building_id });
            result = { exported: submissions.length };
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.success.push({ building_id, result });

      } catch (error) {
        results.failed.push({ building_id, error: error.message });
      }
    }

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});