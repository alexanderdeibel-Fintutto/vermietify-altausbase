import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, format = 'json' } = await req.json();

    console.log(`[AUDIT-EXPORT] ${submission_id} as ${format}`);

    const logs = await base44.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id
    });

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });

    const auditTrail = {
      submission: submission[0],
      total_events: logs.length,
      events: logs.map(log => ({
        timestamp: log.created_date,
        action: log.action,
        performed_by: log.performed_by || log.created_by,
        details: log.details
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      export_date: new Date().toISOString(),
      exported_by: user.email
    };

    let content, contentType, filename;

    if (format === 'json') {
      content = JSON.stringify(auditTrail, null, 2);
      contentType = 'application/json';
      filename = `audit_trail_${submission_id}.json`;
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'Action', 'Performed By', 'Details'];
      const rows = auditTrail.events.map(e => [
        new Date(e.timestamp).toLocaleString('de-DE'),
        e.action,
        e.performed_by,
        JSON.stringify(e.details)
      ]);
      
      content = [headers, ...rows].map(row => row.join(';')).join('\n');
      contentType = 'text/csv';
      filename = `audit_trail_${submission_id}.csv`;
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});