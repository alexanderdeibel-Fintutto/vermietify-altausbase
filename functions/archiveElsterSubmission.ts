import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[ARCHIVE] Archiving submission:', submission_id);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // GoBD-konforme Archivierung
    await base44.entities.ElsterSubmission.update(submission_id, {
      status: 'ARCHIVED',
      archived_at: new Date().toISOString()
    });

    // Audit-Log
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id,
      event_type: 'ARCHIVED',
      details: {
        archived_by: user.email,
        reason: 'Manual archive - 10 Jahre Aufbewahrungspflicht'
      }
    });

    return Response.json({ 
      success: true, 
      message: 'Erfolgreich archiviert (10 Jahre Aufbewahrungspflicht)'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});