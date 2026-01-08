import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log(`[DUPLICATE] Checking ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Suche nach ähnlichen Submissions
    const candidates = await base44.entities.ElsterSubmission.filter({
      tax_form_type: sub.tax_form_type,
      tax_year: sub.tax_year,
      building_id: sub.building_id
    });

    const duplicates = [];

    for (const candidate of candidates) {
      if (candidate.id === sub.id) continue;

      let similarity = 0;
      let matches = 0;
      let total = 0;

      if (sub.form_data && candidate.form_data) {
        const fields = new Set([...Object.keys(sub.form_data), ...Object.keys(candidate.form_data)]);
        
        fields.forEach(field => {
          total++;
          const val1 = sub.form_data[field];
          const val2 = candidate.form_data[field];

          if (val1 === val2) {
            matches++;
          } else if (typeof val1 === 'number' && typeof val2 === 'number') {
            const diff = Math.abs(val1 - val2);
            const avg = (val1 + val2) / 2;
            if (avg > 0 && diff / avg < 0.05) { // 5% Toleranz
              matches += 0.8;
            }
          }
        });

        similarity = total > 0 ? (matches / total) * 100 : 0;
      }

      if (similarity > 85) {
        duplicates.push({
          id: candidate.id,
          similarity: Math.round(similarity),
          created_date: candidate.created_date,
          status: candidate.status
        });
      }
    }

    console.log(`[DUPLICATE] Found ${duplicates.length} potential duplicates`);

    return Response.json({
      success: true,
      is_duplicate: duplicates.length > 0,
      duplicates: duplicates.sort((a, b) => b.similarity - a.similarity)
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});