import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, form_data } = await req.json();

    if (!submission_id || !form_data) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[AUTO-SAVE] Saving submission ${submission_id}`);

    // Aktualisiere nur form_data, nicht den Status
    await base44.entities.ElsterSubmission.update(submission_id, {
      form_data,
      updated_date: new Date().toISOString()
    });

    console.log('[SUCCESS] Auto-save completed');

    return Response.json({
      success: true,
      saved_at: new Date().toISOString(),
      message: 'Formular automatisch gespeichert'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});