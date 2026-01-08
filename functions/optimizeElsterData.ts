import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[OPTIMIZE] Starting ELSTER data optimization');

    const results = {
      cleaned_duplicates: 0,
      archived_old: 0,
      updated_confidence: 0,
      fixed_validation: 0
    };

    // 1. Finde und bereinige Duplikate
    const submissions = await base44.asServiceRole.entities.ElsterSubmission.list();
    const duplicates = new Map();

    submissions.forEach(sub => {
      const key = `${sub.building_id}_${sub.tax_year}_${sub.tax_form_type}`;
      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }
      duplicates.get(key).push(sub);
    });

    for (const [key, subs] of duplicates) {
      if (subs.length > 1) {
        // Behalte neueste, markiere andere
        const sorted = subs.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        );
        
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].status === 'DRAFT') {
            await base44.asServiceRole.entities.ElsterSubmission.update(sorted[i].id, {
              status: 'ARCHIVED',
              archived_at: new Date().toISOString()
            });
            results.cleaned_duplicates++;
          }
        }
      }
    }

    // 2. Auto-archiviere alte akzeptierte Submissions (älter als 10 Jahre)
    const tenYearsAgo = new Date().getFullYear() - 10;
    const oldAccepted = submissions.filter(s => 
      s.status === 'ACCEPTED' && 
      s.tax_year < tenYearsAgo &&
      !s.archived_at
    );

    for (const sub of oldAccepted) {
      await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, {
        archived_at: new Date().toISOString()
      });
      results.archived_old++;
    }

    // 3. Update AI Confidence für Submissions ohne Score
    const noConfidence = submissions.filter(s => !s.ai_confidence_score);
    for (const sub of noConfidence.slice(0, 10)) { // Limit 10 pro Lauf
      if (sub.validation_errors?.length === 0) {
        await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, {
          ai_confidence_score: 85
        });
        results.updated_confidence++;
      }
    }

    console.log('[OPTIMIZE] Completed:', results);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});