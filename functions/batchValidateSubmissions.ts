import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids) || submission_ids.length === 0) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[BATCH-VALIDATE] Starting validation of ${submission_ids.length} submissions`);

    const results = {
      total: submission_ids.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };

    for (const id of submission_ids) {
      try {
        const submissions = await base44.entities.ElsterSubmission.filter({ id });
        if (submissions.length === 0) {
          results.details.push({ id, status: 'not_found', errors: ['Submission not found'] });
          results.failed++;
          continue;
        }

        const submission = submissions[0];

        // Validiere Formular
        const validationResponse = await base44.functions.invoke('validateFormPlausibility', {
          form_data: submission.form_data,
          form_type: submission.tax_form_type,
          legal_form: submission.legal_form
        });

        const validation = validationResponse.data.validation;

        // Update Submission mit Validierungsergebnis
        await base44.asServiceRole.entities.ElsterSubmission.update(id, {
          validation_errors: validation.errors || [],
          validation_warnings: validation.warnings || [],
          ai_confidence_score: validation.plausibility_score || submission.ai_confidence_score,
          status: validation.errors?.length > 0 ? 'DRAFT' : 'VALIDATED'
        });

        const hasErrors = validation.errors && validation.errors.length > 0;
        const hasWarnings = validation.warnings && validation.warnings.length > 0;

        if (hasErrors) {
          results.failed++;
        } else {
          results.passed++;
        }

        if (hasWarnings) {
          results.warnings++;
        }

        results.details.push({
          id,
          status: hasErrors ? 'failed' : 'passed',
          errors: validation.errors || [],
          warnings: validation.warnings || [],
          plausibility_score: validation.plausibility_score
        });

      } catch (error) {
        console.error(`[ERROR] Validation failed for ${id}:`, error);
        results.failed++;
        results.details.push({
          id,
          status: 'error',
          errors: [error.message]
        });
      }
    }

    console.log(`[BATCH-VALIDATE] Complete: ${results.passed} passed, ${results.failed} failed`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});