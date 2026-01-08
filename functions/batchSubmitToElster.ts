import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { submission_ids, submission_mode = 'TEST' } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids)) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[BATCH-SUBMIT] Processing ${submission_ids.length} submissions in ${submission_mode} mode`);

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const submission_id of submission_ids) {
      try {
        const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
        
        if (!submissions || submissions.length === 0) {
          results.skipped.push({
            id: submission_id,
            reason: 'Not found'
          });
          continue;
        }

        const submission = submissions[0];

        // Überspringe bereits übermittelte
        if (['SUBMITTED', 'ACCEPTED'].includes(submission.status)) {
          results.skipped.push({
            id: submission_id,
            reason: `Already ${submission.status}`
          });
          continue;
        }

        // Validierung
        const validationResponse = await base44.functions.invoke('intelligentFormValidation', {
          submission_id
        });

        if (!validationResponse.data.validation.is_valid) {
          results.failed.push({
            id: submission_id,
            reason: 'Validation failed',
            errors: validationResponse.data.validation.errors
          });
          continue;
        }

        // XML generieren
        const xmlResponse = await base44.functions.invoke('generateElsterXML', {
          submission_id,
          submission_mode
        });

        if (!xmlResponse.data.success) {
          results.failed.push({
            id: submission_id,
            reason: 'XML generation failed',
            error: xmlResponse.data.error
          });
          continue;
        }

        // An ELSTER senden
        const submitResponse = await base44.functions.invoke('submitToElster', {
          submission_id,
          submission_mode
        });

        if (submitResponse.data.success) {
          results.success.push({
            id: submission_id,
            transfer_ticket: submitResponse.data.transfer_ticket
          });
          console.log(`[SUCCESS] Submitted ${submission_id}`);
        } else {
          results.failed.push({
            id: submission_id,
            reason: 'Submission failed',
            error: submitResponse.data.error
          });
        }

        // Kleine Pause zwischen Submissions
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.failed.push({
          id: submission_id,
          reason: 'Exception',
          error: error.message
        });
        console.error(`[ERROR] Failed to process ${submission_id}:`, error);
      }
    }

    const summary = {
      total: submission_ids.length,
      successful: results.success.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    };

    console.log(`[COMPLETE] Batch submission: ${summary.successful}/${summary.total} successful`);

    return Response.json({
      success: true,
      summary,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});