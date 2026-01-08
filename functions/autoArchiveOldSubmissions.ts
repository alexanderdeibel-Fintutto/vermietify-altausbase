import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[AUTO ARCHIVE] Starting automatic archiving');

    // Hole alle akzeptierten Submissions älter als das aktuelle Steuerjahr minus 2
    const currentYear = new Date().getFullYear();
    const archiveThreshold = currentYear - 2;

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      status: 'ACCEPTED',
      tax_year: { $lt: archiveThreshold }
    });

    const archived = [];
    const failed = [];

    for (const submission of submissions) {
      if (submission.status === 'ARCHIVED') {
        continue; // Already archived
      }

      try {
        // Erstelle Backup vor Archivierung
        await base44.asServiceRole.functions.invoke('createSubmissionBackup', {
          submission_id: submission.id,
          reason: 'Automatische GoBD-Archivierung'
        });

        // Update Status zu ARCHIVED
        await base44.asServiceRole.entities.ElsterSubmission.update(submission.id, {
          status: 'ARCHIVED',
          archived_at: new Date().toISOString(),
          metadata: {
            ...submission.metadata,
            archive_reason: 'Automatische Archivierung nach 2 Jahren',
            archive_date: new Date().toISOString()
          }
        });

        // Log Audit Event
        await base44.asServiceRole.functions.invoke('logElsterAuditEvent', {
          submission_id: submission.id,
          event_type: 'AUTO_ARCHIVED',
          details: `Automatisch archiviert (Steuerjahr ${submission.tax_year})`,
          metadata: { threshold_year: archiveThreshold }
        });

        archived.push({
          id: submission.id,
          tax_year: submission.tax_year,
          form_type: submission.tax_form_type
        });

        console.log(`[ARCHIVED] ${submission.id} (${submission.tax_year})`);

      } catch (error) {
        failed.push({
          id: submission.id,
          error: error.message
        });
        console.error(`[ERROR] Failed to archive ${submission.id}:`, error.message);
      }
    }

    console.log(`[SUCCESS] Archived ${archived.length}, Failed ${failed.length}`);

    return Response.json({
      success: true,
      archived_count: archived.length,
      failed_count: failed.length,
      archived,
      failed
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});