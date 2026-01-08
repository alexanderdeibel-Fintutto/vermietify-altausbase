import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, format = 'individual' } = await req.json();

    console.log(`[BULK-PDF] Generating PDFs for ${submission_ids.length} submissions`);

    const results = { generated: [], failed: [] };

    for (const sub_id of submission_ids) {
      try {
        const response = await base44.functions.invoke('exportTaxFormPDF', {
          submission_id: sub_id
        });

        results.generated.push({ submission_id: sub_id, pdf_data: response.data });
      } catch (error) {
        results.failed.push({ submission_id: sub_id, error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      results,
      total: submission_ids.length,
      generated_count: results.generated.length,
      failed_count: results.failed.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});