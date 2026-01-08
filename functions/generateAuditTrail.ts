import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[AUDIT-TRAIL] Generating for ${submission_id}`);

    const activities = await base44.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id
    }, '-created_date');

    const trail = activities.map(act => ({
      timestamp: act.created_date,
      action: act.action,
      user: act.metadata?.user_name || act.user_id,
      details: act.metadata,
      changes: act.changes
    }));

    const summary = {
      total_activities: activities.length,
      first_activity: trail[trail.length - 1]?.timestamp,
      last_activity: trail[0]?.timestamp,
      users_involved: [...new Set(trail.map(t => t.user))],
      action_counts: {}
    };

    trail.forEach(t => {
      summary.action_counts[t.action] = (summary.action_counts[t.action] || 0) + 1;
    });

    console.log(`[AUDIT-TRAIL] Generated ${trail.length} entries`);

    return Response.json({
      success: true,
      trail,
      summary
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});