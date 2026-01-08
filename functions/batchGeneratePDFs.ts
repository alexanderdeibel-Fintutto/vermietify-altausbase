import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids } = await req.json();

    console.log(`[BATCH-PDF] Generating ${submission_ids.length} PDFs`);

    const results = { success: 0, failed: 0, urls: [] };

    for (const id of submission_ids) {
      try {
        const response = await base44.functions.invoke('exportTaxFormPDF', {
          submission_id: id
        });

        if (response.data) {
          results.success++;
          results.urls.push({
            submission_id: id,
            url: response.data.url || 'generated'
          });
        }
      } catch (error) {
        results.failed++;
        console.error(`Failed to generate PDF for ${id}:`, error);
      }
    }

    console.log(`[BATCH-PDF] Success: ${results.success}/${submission_ids.length}`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});