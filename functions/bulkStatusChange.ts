import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, new_status, reason } = await req.json();

    console.log(`[BULK-STATUS] Updating ${submission_ids.length} submissions to ${new_status}`);

    const results = { updated: 0, failed: 0, errors: [] };

    for (const sub_id of submission_ids) {
      try {
        await base44.entities.ElsterSubmission.update(sub_id, { 
          status: new_status
        });

        // Log audit event
        await base44.functions.invoke('logElsterAuditEvent', {
          submission_id: sub_id,
          event_type: 'status_changed',
          details: { 
            new_status, 
            reason,
            changed_by: user.email 
          }
        });

        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push({ submission_id: sub_id, error: error.message });
      }
    }

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});