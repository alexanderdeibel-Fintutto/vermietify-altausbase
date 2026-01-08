import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, form_data } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[AUTO-SAVE] Saving submission ${submission_id}`);

    // Update Submission
    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      form_data,
      updated_date: new Date().toISOString()
    });

    console.log('[AUTO-SAVE] Saved successfully');

    return Response.json({
      success: true,
      saved_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});