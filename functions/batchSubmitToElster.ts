import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, certificate_id } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids) || !certificate_id) {
      return Response.json({ 
        error: 'submission_ids (array) and certificate_id required' 
      }, { status: 400 });
    }

    console.log(`[BATCH-SUBMIT] Processing ${submission_ids.length} submissions`);

    const results = {
      submitted: 0,
      failed: 0,
      details: []
    };

    for (const id of submission_ids) {
      try {
        const submission = await base44.entities.ElsterSubmission.filter({ id });
        
        if (submission.length === 0) {
          throw new Error('Submission not found');
        }

        const sub = submission[0];

        // Validiere vor Submission
        if (sub.status !== 'VALIDATED' && sub.status !== 'AI_PROCESSED') {
          throw new Error(`Invalid status: ${sub.status}`);
        }

        // Simuliere ELSTER-Submission (in Produktion: echte ELSTER-API)
        const response = await base44.asServiceRole.functions.invoke('submitToElster', {
          submission_id: id,
          certificate_id
        });

        if (response.data?.success) {
          results.submitted++;
          results.details.push({
            id,
            status: 'success',
            transfer_ticket: response.data.transfer_ticket
          });
        } else {
          throw new Error('Submission failed');
        }

      } catch (error) {
        console.error(`Failed to submit ${id}:`, error);
        results.failed++;
        results.details.push({
          id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log(`[BATCH-SUBMIT] Complete: ${results.submitted} submitted, ${results.failed} failed`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});