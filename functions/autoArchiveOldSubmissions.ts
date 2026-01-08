import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { archive_after_days = 365, dry_run = false } = await req.json();

    console.log(`[AUTO-ARCHIVE] Starting ${dry_run ? 'dry run' : 'actual'} archiving`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archive_after_days);

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      status: 'ACCEPTED',
      submission_date: { $lt: cutoffDate.toISOString() }
    });

    const results = {
      total_found: submissions.length,
      archived: 0,
      skipped: 0,
      errors: []
    };

    for (const submission of submissions) {
      try {
        if (submission.status === 'ARCHIVED') {
          results.skipped++;
          continue;
        }

        if (!dry_run) {
          // Erstelle Backup vor Archivierung
          await base44.asServiceRole.functions.invoke('createSubmissionBackup', {
            submission_id: submission.id,
            backup_type: 'auto_archive'
          });

          // Archiviere
          await base44.asServiceRole.entities.ElsterSubmission.update(submission.id, {
            status: 'ARCHIVED',
            archived_at: new Date().toISOString()
          });

          // Log
          await base44.asServiceRole.entities.ActivityLog.create({
            entity_type: 'ElsterSubmission',
            entity_id: submission.id,
            action: 'auto_archived',
            user_id: user.id,
            metadata: {
              archive_after_days,
              original_submission_date: submission.submission_date
            }
          });
        }

        results.archived++;

      } catch (error) {
        console.error(`[ERROR] Failed to archive ${submission.id}:`, error);
        results.errors.push({
          submission_id: submission.id,
          error: error.message
        });
      }
    }

    console.log(`[AUTO-ARCHIVE] Complete: ${results.archived} archived, ${results.skipped} skipped`);

    return Response.json({
      success: true,
      dry_run,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});