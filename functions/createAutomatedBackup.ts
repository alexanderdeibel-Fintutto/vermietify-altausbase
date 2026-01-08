import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, include_metadata = true } = await req.json();

    console.log(`[BACKUP] Creating backup for ${submission_id || 'all submissions'}`);

    let submissions = [];
    if (submission_id) {
      const sub = await base44.entities.ElsterSubmission.filter({ id: submission_id });
      submissions = sub;
    } else {
      submissions = await base44.entities.ElsterSubmission.filter({
        created_by: user.email
      });
    }

    const backupData = {
      created_at: new Date().toISOString(),
      created_by: user.email,
      submissions: submissions.map(sub => ({
        ...sub,
        backup_metadata: include_metadata ? {
          original_id: sub.id,
          backup_date: new Date().toISOString()
        } : undefined
      }))
    };

    // Erstelle Backup-Entity
    const backup = await base44.asServiceRole.entities.Document.create({
      title: `ELSTER Backup ${new Date().toISOString()}`,
      description: `Automatisches Backup von ${submissions.length} Submissions`,
      category: 'elster_backup',
      content: JSON.stringify(backupData, null, 2),
      created_by: user.email,
      metadata: {
        backup_type: 'elster_submissions',
        submission_count: submissions.length,
        retention_years: 10
      }
    });

    console.log(`[BACKUP] Created backup ${backup.id}`);

    return Response.json({
      success: true,
      backup_id: backup.id,
      submissions_backed_up: submissions.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});