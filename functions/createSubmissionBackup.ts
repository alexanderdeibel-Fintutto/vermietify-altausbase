import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, backup_type = 'manual' } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[BACKUP] Creating ${backup_type} backup for ${submission_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Erstelle Backup-Datenstruktur
    const backupData = {
      submission_id,
      backup_type,
      backup_date: new Date().toISOString(),
      backup_by: user.id,
      submission_data: {
        tax_form_type: submission.tax_form_type,
        legal_form: submission.legal_form,
        tax_year: submission.tax_year,
        building_id: submission.building_id,
        submission_mode: submission.submission_mode,
        form_data: submission.form_data,
        xml_data: submission.xml_data,
        status: submission.status,
        ai_confidence_score: submission.ai_confidence_score,
        validation_errors: submission.validation_errors,
        validation_warnings: submission.validation_warnings,
        elster_response: submission.elster_response,
        transfer_ticket: submission.transfer_ticket,
        submission_date: submission.submission_date,
        certificate_used: submission.certificate_used
      }
    };

    // Speichere als ActivityLog für GoBD-Compliance
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'backup_created',
      user_id: user.id,
      changes: backupData,
      metadata: {
        backup_type,
        file_size: JSON.stringify(backupData).length,
        compliance: 'GoBD'
      }
    });

    console.log(`[BACKUP] Created successfully`);

    return Response.json({
      success: true,
      backup: {
        id: submission_id,
        type: backup_type,
        created_at: backupData.backup_date,
        size_bytes: JSON.stringify(backupData).length
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});