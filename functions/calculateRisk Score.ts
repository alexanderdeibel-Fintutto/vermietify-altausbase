import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[RISK-SCORE] Calculating for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    let riskScore = 0;
    const riskFactors = [];

    // 1. Validierungsfehler (hohes Risiko)
    if (sub.validation_errors && sub.validation_errors.length > 0) {
      riskScore += sub.validation_errors.length * 10;
      riskFactors.push({
        factor: 'Validierungsfehler',
        impact: sub.validation_errors.length * 10,
        severity: 'HIGH'
      });
    }

    // 2. AI-Confidence niedrig
    if (sub.ai_confidence_score < 70) {
      const impact = (70 - sub.ai_confidence_score) / 2;
      riskScore += impact;
      riskFactors.push({
        factor: 'Niedrige KI-Vertrauenswürdigkeit',
        impact: Math.round(impact),
        severity: 'MEDIUM'
      });
    }

    // 3. Fehlende Dokumentation
    const docCount = sub.form_data?.uploaded_documents?.length || 0;
    if (docCount === 0) {
      riskScore += 15;
      riskFactors.push({
        factor: 'Keine Belege hochgeladen',
        impact: 15,
        severity: 'MEDIUM'
      });
    }

    // 4. Unvollständige Daten
    const formData = sub.form_data || {};
    const fieldCount = Object.keys(formData).length;
    if (fieldCount < 10) {
      riskScore += 20;
      riskFactors.push({
        factor: 'Wenige Felder ausgefüllt',
        impact: 20,
        severity: 'HIGH'
      });
    }

    // 5. Test-Modus bei Produktiv-Jahr
    if (sub.submission_mode === 'TEST' && sub.tax_year < new Date().getFullYear()) {
      riskScore += 10;
      riskFactors.push({
        factor: 'Test-Modus für vergangenes Jahr',
        impact: 10,
        severity: 'LOW'
      });
    }

    const riskLevel = riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';

    const result = {
      submission_id,
      risk_score: Math.round(riskScore),
      risk_level: riskLevel,
      risk_factors: riskFactors,
      recommendation: riskLevel === 'HIGH' 
        ? 'Bitte beheben Sie die kritischen Probleme vor der Übermittlung'
        : riskLevel === 'MEDIUM'
        ? 'Einige Optimierungen empfohlen'
        : 'Submission erscheint sicher'
    };

    console.log(`[RISK-SCORE] Score: ${result.risk_score}, Level: ${riskLevel}`);

    return Response.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});