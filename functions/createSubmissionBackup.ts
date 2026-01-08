import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log(`[BACKUP] Creating backup for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Erstelle Backup-Eintrag
    const backup = {
      submission_id: sub.id,
      backup_data: {
        ...sub,
        backup_timestamp: new Date().toISOString()
      },
      created_by: user.email,
      backup_type: 'manual'
    };

    // Speichere als Activity Log für einfachen Abruf
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'backup_created',
      details: backup,
      performed_by: user.email
    });

    console.log(`[BACKUP] Created for ${submission_id}`);

    return Response.json({
      success: true,
      message: 'Backup erfolgreich erstellt'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});