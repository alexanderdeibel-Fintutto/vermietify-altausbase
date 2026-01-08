import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DUPLICATE-DETECTION] Scanning for duplicate submissions');

    const submissions = await base44.entities.ElsterSubmission.list();
    
    const duplicates = [];
    const processed = new Set();

    for (let i = 0; i < submissions.length; i++) {
      const sub1 = submissions[i];
      if (processed.has(sub1.id)) continue;

      for (let j = i + 1; j < submissions.length; j++) {
        const sub2 = submissions[j];
        if (processed.has(sub2.id)) continue;

        // Prüfe auf Duplikate: gleiche Form, Jahr, Gebäude
        if (sub1.tax_form_type === sub2.tax_form_type &&
            sub1.tax_year === sub2.tax_year &&
            sub1.building_id === sub2.building_id &&
            sub1.legal_form === sub2.legal_form) {
          
          duplicates.push({
            submission_1: {
              id: sub1.id,
              status: sub1.status,
              created_date: sub1.created_date,
              ai_confidence_score: sub1.ai_confidence_score
            },
            submission_2: {
              id: sub2.id,
              status: sub2.status,
              created_date: sub2.created_date,
              ai_confidence_score: sub2.ai_confidence_score
            },
            recommendation: sub1.ai_confidence_score > sub2.ai_confidence_score 
              ? `Keep ${sub1.id}, delete ${sub2.id}` 
              : `Keep ${sub2.id}, delete ${sub1.id}`
          });

          processed.add(sub2.id);
        }
      }
    }

    return Response.json({ 
      success: true, 
      duplicates_found: duplicates.length,
      duplicates
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});