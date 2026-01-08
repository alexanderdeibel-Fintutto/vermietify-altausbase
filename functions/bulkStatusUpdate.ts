import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, action, data } = await req.json();

    console.log(`[BULK] ${action} for ${submission_ids.length} submissions`);

    const results = { success: 0, failed: 0, errors: [] };

    for (const id of submission_ids) {
      try {
        if (action === 'update_status') {
          await base44.entities.ElsterSubmission.update(id, {
            status: data.status
          });
        } else if (action === 'archive') {
          await base44.entities.ElsterSubmission.update(id, {
            status: 'ARCHIVED',
            archived_at: new Date().toISOString()
          });
        } else if (action === 'validate') {
          const response = await base44.functions.invoke('validateFormPlausibility', {
            submission_id: id
          });
          if (response.data.success) {
            await base44.entities.ElsterSubmission.update(id, {
              status: 'VALIDATED'
            });
          }
        } else if (action === 'generate_pdf') {
          await base44.functions.invoke('exportTaxFormPDF', {
            submission_id: id
          });
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    console.log(`[BULK] Completed: ${results.success}/${submission_ids.length}`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});