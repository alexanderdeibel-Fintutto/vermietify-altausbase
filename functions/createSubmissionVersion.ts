import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, changes, comment } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[VERSION] Creating version for submission ${submission_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Hole bisherige Versionen aus Metadata
    const versions = submission.metadata?.versions || [];
    const newVersionNumber = versions.length + 1;

    const version = {
      version: newVersionNumber,
      timestamp: new Date().toISOString(),
      user: user.email,
      comment: comment || 'No comment',
      changes: changes || {},
      snapshot: {
        form_data: submission.form_data,
        status: submission.status,
        validation_errors: submission.validation_errors,
        validation_warnings: submission.validation_warnings,
        ai_confidence_score: submission.ai_confidence_score
      }
    };

    versions.push(version);

    // Update Submission mit neuer Version
    await base44.entities.ElsterSubmission.update(submission_id, {
      metadata: {
        ...submission.metadata,
        versions,
        current_version: newVersionNumber
      }
    });

    // Log Audit Event
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id,
      event_type: 'VERSION_CREATED',
      details: `Version ${newVersionNumber} erstellt: ${comment || 'No comment'}`,
      metadata: { version: newVersionNumber }
    });

    console.log(`[SUCCESS] Version ${newVersionNumber} created`);

    return Response.json({
      success: true,
      version: newVersionNumber,
      total_versions: versions.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});