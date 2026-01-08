import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[OPTIMIZE] Starting performance optimization');

    const results = {
      archived: 0,
      cleaned: 0,
      optimized: 0
    };

    // Archiviere alte accepted Submissions
    const oldAccepted = await base44.asServiceRole.entities.ElsterSubmission.filter({
      status: 'ACCEPTED'
    });

    for (const sub of oldAccepted) {
      const age = Date.now() - new Date(sub.created_date).getTime();
      if (age > 365 * 24 * 60 * 60 * 1000 && sub.status === 'ACCEPTED') {
        await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, {
          status: 'ARCHIVED',
          archived_at: new Date().toISOString()
        });
        results.archived++;
      }
    }

    // Bereinige alte Activity Logs
    const oldLogs = await base44.asServiceRole.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission'
    });

    let cleanedLogs = 0;
    for (const log of oldLogs) {
      const age = Date.now() - new Date(log.created_date).getTime();
      if (age > 2 * 365 * 24 * 60 * 60 * 1000) {
        await base44.asServiceRole.entities.ActivityLog.delete(log.id);
        cleanedLogs++;
      }
    }
    results.cleaned = cleanedLogs;

    console.log(`[OPTIMIZE] Complete: archived ${results.archived}, cleaned ${results.cleaned}`);

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});