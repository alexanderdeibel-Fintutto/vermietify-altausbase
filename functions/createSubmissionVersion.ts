import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, notes } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[VERSION] Creating version snapshot for ${submission_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Zähle existierende Versionen
    const existingVersions = await base44.asServiceRole.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'version_created'
    });

    const versionNumber = existingVersions.length + 1;

    // Erstelle Versions-Snapshot
    const versionData = {
      version_number: versionNumber,
      form_data: submission.form_data,
      status: submission.status,
      ai_confidence_score: submission.ai_confidence_score,
      validation_errors: submission.validation_errors,
      validation_warnings: submission.validation_warnings,
      notes,
      created_at: new Date().toISOString()
    };

    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'version_created',
      user_id: user.id,
      changes: versionData,
      metadata: {
        version_number: versionNumber,
        notes
      }
    });

    console.log(`[VERSION] Created v${versionNumber}`);

    return Response.json({
      success: true,
      version: {
        number: versionNumber,
        created_at: versionData.created_at,
        created_by: user.full_name
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});