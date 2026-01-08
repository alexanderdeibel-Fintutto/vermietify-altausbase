import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[QUALITY-MONITOR] Running automated checks');

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.list();
    const issues = [];
    let score = 100;

    // Prüfe auf Submissions ohne XML (außer DRAFT)
    const missingXML = submissions.filter(s => s.status !== 'DRAFT' && !s.xml_data);
    if (missingXML.length > 0) {
      issues.push({ type: 'missing_xml', count: missingXML.length, severity: 'high' });
      score -= 15;
    }

    // Prüfe auf alte Draft-Submissions
    const oldDrafts = submissions.filter(s => {
      if (s.status !== 'DRAFT') return false;
      const age = Date.now() - new Date(s.created_date).getTime();
      return age > 30 * 24 * 60 * 60 * 1000; // > 30 Tage
    });
    if (oldDrafts.length > 0) {
      issues.push({ type: 'old_drafts', count: oldDrafts.length, severity: 'medium' });
      score -= 10;
    }

    // Prüfe auf Submissions mit vielen Fehlern
    const errorRidden = submissions.filter(s => s.validation_errors?.length > 5);
    if (errorRidden.length > 0) {
      issues.push({ type: 'high_error_count', count: errorRidden.length, severity: 'high' });
      score -= 20;
    }

    // Benachrichtige bei kritischen Problemen
    if (score < 60) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: 'ELSTER Quality Alert',
          body: `
            <h2>Qualitätsscore: ${score}/100</h2>
            <p>Gefundene Probleme:</p>
            <ul>
              ${issues.map(i => `<li>${i.type}: ${i.count} (${i.severity})</li>`).join('')}
            </ul>
          `
        });
      }
    }

    return Response.json({ success: true, score, issues });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});