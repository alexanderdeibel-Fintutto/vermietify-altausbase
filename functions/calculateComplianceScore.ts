import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const sub = subs[0];
    let score = 100;
    const issues = [];

    // Vollständigkeit (30 Punkte)
    const requiredFields = ['finanzamt', 'steuernummer', 'einnahmen_gesamt', 'werbungskosten_gesamt'];
    const missingFields = requiredFields.filter(f => !sub.form_data?.[f]);
    if (missingFields.length > 0) {
      const penalty = missingFields.length * 7.5;
      score -= penalty;
      issues.push({ type: 'missing_fields', count: missingFields.length, penalty });
    }

    // Validierung (30 Punkte)
    const errorCount = sub.validation_errors?.length || 0;
    if (errorCount > 0) {
      const penalty = Math.min(errorCount * 10, 30);
      score -= penalty;
      issues.push({ type: 'validation_errors', count: errorCount, penalty });
    }

    // Aktualität (20 Punkte)
    const age = Date.now() - new Date(sub.updated_date || sub.created_date).getTime();
    const daysOld = Math.floor(age / (1000 * 60 * 60 * 24));
    if (daysOld > 90) {
      const penalty = Math.min((daysOld - 90) / 10, 20);
      score -= penalty;
      issues.push({ type: 'outdated', days: daysOld, penalty });
    }

    // Dokumentation (10 Punkte)
    if (!sub.pdf_url) {
      score -= 5;
      issues.push({ type: 'no_pdf', penalty: 5 });
    }

    // XML-Qualität (10 Punkte)
    if (!sub.xml_data) {
      score -= 10;
      issues.push({ type: 'no_xml', penalty: 10 });
    }

    score = Math.max(0, Math.round(score));

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    return Response.json({ 
      success: true, 
      score, 
      grade,
      issues,
      recommendation: score < 80 ? 'Verbesserung empfohlen' : 'Compliance ausreichend'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});