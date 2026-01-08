import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids)) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[BULK-ARCHIVE] Archiving ${submission_ids.length} submissions`);

    const results = {
      archived: 0,
      failed: 0,
      errors: []
    };

    for (const id of submission_ids) {
      try {
        await base44.asServiceRole.entities.ElsterSubmission.update(id, {
          status: 'ARCHIVED',
          archived_at: new Date().toISOString()
        });

        // Log
        await base44.asServiceRole.entities.ActivityLog.create({
          entity_type: 'ElsterSubmission',
          entity_id: id,
          action: 'archived',
          user_id: user.id,
          metadata: {
            archived_by: user.email,
            retention_period: '10 years (GoBD)'
          }
        });

        results.archived++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    console.log(`[BULK-ARCHIVE] Complete: ${results.archived} archived`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});