import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, reason } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[BACKUP] Creating backup for submission ${submission_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Erstelle Backup als JSON
    const backup = {
      original_id: submission.id,
      backup_timestamp: new Date().toISOString(),
      backup_reason: reason || 'Manual backup',
      backup_by: user.email,
      data: {
        ...submission,
        id: undefined // Remove ID for backup
      }
    };

    // Upload als privates File
    const jsonBlob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const uploadResponse = await base44.integrations.Core.UploadPrivateFile({
      file: jsonBlob
    });

    // Log Audit Event
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id,
      event_type: 'BACKUP_CREATED',
      details: `Backup erstellt: ${reason || 'Manual backup'}`,
      metadata: { file_uri: uploadResponse.file_uri }
    });

    console.log('[SUCCESS] Backup created');

    return Response.json({
      success: true,
      backup_uri: uploadResponse.file_uri,
      backup_timestamp: backup.backup_timestamp
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});