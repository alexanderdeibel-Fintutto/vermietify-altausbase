import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DATA-QUALITY] Scanning all submissions...');

    const submissions = await base44.entities.ElsterSubmission.list();

    const quality = {
      total_submissions: submissions.length,
      quality_scores: [],
      issues: {
        missing_fields: 0,
        low_confidence: 0,
        validation_errors: 0,
        missing_documentation: 0
      },
      average_score: 0,
      problematic_submissions: []
    };

    submissions.forEach(sub => {
      let score = 100;
      const issues = [];

      // 1. Fehlende Pflichtfelder
      const formData = sub.form_data || {};
      const fieldCount = Object.keys(formData).length;
      if (fieldCount < 10) {
        score -= 20;
        issues.push('Wenige Felder ausgefüllt');
        quality.issues.missing_fields++;
      }

      // 2. KI-Vertrauenswürdigkeit
      if (sub.ai_confidence_score < 70) {
        score -= 15;
        issues.push('Niedrige KI-Confidence');
        quality.issues.low_confidence++;
      }

      // 3. Validierungsfehler
      if (sub.validation_errors && sub.validation_errors.length > 0) {
        score -= sub.validation_errors.length * 10;
        issues.push(`${sub.validation_errors.length} Validierungsfehler`);
        quality.issues.validation_errors++;
      }

      // 4. Dokumentation
      if (!sub.pdf_url && sub.status !== 'DRAFT') {
        score -= 10;
        issues.push('Kein PDF generiert');
        quality.issues.missing_documentation++;
      }

      score = Math.max(0, score);
      quality.quality_scores.push(score);

      if (score < 70) {
        quality.problematic_submissions.push({
          id: sub.id,
          form_type: sub.tax_form_type,
          year: sub.tax_year,
          score,
          issues
        });
      }
    });

    quality.average_score = quality.quality_scores.length > 0
      ? Math.round(quality.quality_scores.reduce((a, b) => a + b, 0) / quality.quality_scores.length)
      : 0;

    const recommendation = quality.average_score >= 80 
      ? 'Datenqualität ist gut'
      : quality.average_score >= 60
      ? 'Einige Verbesserungen empfohlen'
      : 'Kritische Qualitätsprobleme - bitte beheben';

    console.log(`[DATA-QUALITY] Average score: ${quality.average_score}`);

    return Response.json({
      success: true,
      quality,
      recommendation
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});