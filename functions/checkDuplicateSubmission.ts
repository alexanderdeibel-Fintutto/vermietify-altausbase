import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_year, form_type } = await req.json();

    if (!building_id || !tax_year || !form_type) {
      return Response.json({ error: 'building_id, tax_year, and form_type required' }, { status: 400 });
    }

    console.log(`[DUPLICATE-CHECK] Checking ${form_type} for building ${building_id}, year ${tax_year}`);

    // Suche nach existierenden Submissions
    const existingSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_year,
      tax_form_type: form_type
    });

    const hasDuplicate = existingSubmissions.length > 0;
    const acceptedSubmission = existingSubmissions.find(s => s.status === 'ACCEPTED');
    const activeSubmissions = existingSubmissions.filter(s => 
      s.status !== 'ARCHIVED' && s.status !== 'REJECTED'
    );

    console.log(`[DUPLICATE-CHECK] Found ${existingSubmissions.length} existing, ${activeSubmissions.length} active`);

    return Response.json({
      success: true,
      has_duplicate: hasDuplicate,
      duplicates: existingSubmissions.map(s => ({
        id: s.id,
        status: s.status,
        created_date: s.created_date,
        submission_date: s.submission_date,
        ai_confidence_score: s.ai_confidence_score
      })),
      has_accepted: !!acceptedSubmission,
      accepted_submission_id: acceptedSubmission?.id,
      warning: hasDuplicate ? 
        `Es existieren bereits ${existingSubmissions.length} Submission(s) für dieses Gebäude und Jahr` : 
        null,
      recommendation: acceptedSubmission ?
        'Eine Submission wurde bereits akzeptiert. Erstellen Sie nur eine neue, wenn nötig (z.B. Korrektur).' :
        activeSubmissions.length > 0 ?
        'Es existiert bereits eine aktive Submission. Möchten Sie diese bearbeiten oder eine neue erstellen?' :
        null
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});