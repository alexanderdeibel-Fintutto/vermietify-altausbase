import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, new_status, reason } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids) || !new_status) {
      return Response.json({ 
        error: 'submission_ids (array) and new_status required' 
      }, { status: 400 });
    }

    console.log(`[BATCH-STATUS] Updating ${submission_ids.length} submissions to ${new_status}`);

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const id of submission_ids) {
      try {
        await base44.asServiceRole.entities.ElsterSubmission.update(id, {
          status: new_status
        });

        // Log
        await base44.asServiceRole.entities.ActivityLog.create({
          entity_type: 'ElsterSubmission',
          entity_id: id,
          action: 'status_changed',
          user_id: user.id,
          changes: { status: new_status },
          metadata: {
            reason: reason || 'Batch-Update',
            user_name: user.full_name,
            previous_status: 'unknown'
          }
        });

        results.updated++;
      } catch (error) {
        console.error(`Failed to update ${id}:`, error);
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    console.log(`[BATCH-STATUS] Complete: ${results.updated} updated, ${results.failed} failed`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});