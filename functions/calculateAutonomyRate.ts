import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[AUTONOMY] Calculating autonomy rate...');

    // 1. Hole Submissions
    const submissions = await base44.entities.ElsterSubmission.filter();
    
    // 2. Berechne automatisch erstellte
    const autoCreated = submissions.filter(s => 
      s.ai_confidence_score && s.ai_confidence_score >= 85
    );

    // 3. Berechne akzeptierte ohne Änderungen
    const autoAccepted = submissions.filter(s =>
      s.status === 'ACCEPTED' && s.ai_confidence_score >= 80
    );

    // 4. Hole Kategorisierungen mit hohem Confidence
    const categorizations = await base44.entities.FinancialItem.filter();
    const autoCategories = categorizations.filter(c => 
      c.ai_confidence_score && c.ai_confidence_score >= 90
    );

    // 5. Berechne Fehlerrate
    const gaps = await base44.entities.KnowledgeGap.filter();
    const errorRate = gaps.length > 0 ? 
      (gaps.filter(g => g.research_status !== 'VERIFIED').length / gaps.length) * 100 : 0;

    // 6. Gesamtautonomierate
    const autonomyScore = (
      (autoCreated.length / Math.max(submissions.length, 1)) * 40 +
      (autoAccepted.length / Math.max(submissions.length, 1)) * 30 +
      (autoCategories.length / Math.max(categorizations.length, 1)) * 20 +
      Math.max(0, 100 - errorRate * 2) * 0.1
    );

    const autonomyRate = Math.round(Math.min(100, autonomyScore));

    // 7. Speichere Metrik
    const metrics = {
      autonomy_rate: autonomyRate,
      calculated_at: new Date().toISOString(),
      auto_created: autoCreated.length,
      auto_accepted: autoAccepted.length,
      auto_categories: autoCategories.length,
      total_submissions: submissions.length,
      knowledge_gaps: gaps.length,
      error_recovery_rate: Math.round((gaps.filter(g => g.research_status === 'VERIFIED').length / Math.max(gaps.length, 1)) * 100)
    };

    return Response.json({
      success: true,
      autonomy_rate: autonomyRate,
      metrics
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});