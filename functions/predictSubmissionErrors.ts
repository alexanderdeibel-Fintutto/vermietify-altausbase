import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[PREDICT] Analyzing potential errors for submission:', submission_id);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submission || submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const predictions = { risk_score: 0, potential_issues: [], recommendations: [] };

    // Historische Fehler analysieren
    const historical = await base44.entities.ElsterSubmission.filter({ 
      tax_form_type: sub.tax_form_type,
      tax_year: sub.tax_year 
    });

    const commonErrors = {};
    historical.forEach(h => {
      if (h.validation_errors?.length > 0) {
        h.validation_errors.forEach(err => {
          const key = err.field || 'unknown';
          commonErrors[key] = (commonErrors[key] || 0) + 1;
        });
      }
    });

    // Risiko-Score berechnen
    let riskFactors = 0;

    if (!sub.form_data || Object.keys(sub.form_data).length < 5) {
      riskFactors += 30;
      predictions.potential_issues.push({
        severity: 'high',
        issue: 'Unvollständige Formulardaten',
        description: 'Weniger als 5 Felder ausgefüllt'
      });
    }

    if (sub.ai_confidence_score && sub.ai_confidence_score < 75) {
      riskFactors += 25;
      predictions.potential_issues.push({
        severity: 'medium',
        issue: 'Niedriges KI-Vertrauen',
        description: `Nur ${sub.ai_confidence_score}% Vertrauen`
      });
    }

    if (!sub.building_id) {
      riskFactors += 20;
      predictions.potential_issues.push({
        severity: 'medium',
        issue: 'Kein Gebäude zugeordnet',
        description: 'Fehlende Gebäude-Referenz'
      });
    }

    predictions.risk_score = Math.min(riskFactors, 100);

    // Empfehlungen
    if (predictions.risk_score > 50) {
      predictions.recommendations.push('Manuelle Überprüfung vor Übermittlung empfohlen');
    }
    if (Object.keys(commonErrors).length > 0) {
      const topError = Object.entries(commonErrors).sort((a, b) => b[1] - a[1])[0];
      predictions.recommendations.push(`Achten Sie besonders auf Feld: ${topError[0]}`);
    }
    if (sub.ai_confidence_score < 85) {
      predictions.recommendations.push('KI-basierte Vorschläge nutzen');
    }

    return Response.json({ success: true, predictions });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});