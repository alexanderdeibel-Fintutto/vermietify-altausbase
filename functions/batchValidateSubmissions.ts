import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids } = await req.json();

    console.log('[BATCH-VALIDATE] Validating', submission_ids?.length, 'submissions');

    const toValidate = submission_ids && submission_ids.length > 0
      ? await Promise.all(submission_ids.map(id => 
          base44.entities.ElsterSubmission.filter({ id }).then(subs => subs[0])
        ))
      : await base44.entities.ElsterSubmission.list('-created_date', 100);

    const results = [];

    for (const submission of toValidate) {
      if (!submission) continue;

      try {
        // Invoke validation function
        const validation = await base44.functions.invoke('validateFormPlausibility', {
          submission_id: submission.id,
          form_data: submission.form_data,
          tax_year: submission.tax_year
        });

        results.push({
          submission_id: submission.id,
          valid: validation.data.valid !== false,
          issues: validation.data.issues || [],
          confidence: validation.data.confidence_score || 0
        });

      } catch (error) {
        results.push({
          submission_id: submission.id,
          valid: false,
          issues: [{ message: error.message }]
        });
      }
    }

    const validCount = results.filter(r => r.valid).length;
    const issuesCount = results.reduce((sum, r) => sum + r.issues.length, 0);

    return Response.json({ 
      success: true, 
      total_validated: results.length,
      valid: validCount,
      invalid: results.length - validCount,
      total_issues: issuesCount,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});