import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { context } = await req.json();

    console.log('[SMART-SUGGESTIONS] Generating suggestions for:', context);

    const suggestions = [];

    // Analysiere User-Historie
    const userSubmissions = await base44.entities.ElsterSubmission.filter({ 
      created_by: user.email 
    });

    // Vorschlag 1: Basierend auf vergangenen Jahren
    if (userSubmissions.length > 0) {
      const lastYear = Math.max(...userSubmissions.map(s => s.tax_year));
      const currentYear = new Date().getFullYear();
      
      if (lastYear < currentYear - 1) {
        suggestions.push({
          type: 'missing_year',
          priority: 'high',
          title: `Steuerformular für ${currentYear - 1} fehlt`,
          description: `Sie haben noch keine Submission für das Jahr ${currentYear - 1}`,
          action: 'create_submission',
          params: { year: currentYear - 1 }
        });
      }
    }

    // Vorschlag 2: Unvollständige Submissions
    const incomplete = userSubmissions.filter(s => s.status === 'DRAFT');
    if (incomplete.length > 0) {
      suggestions.push({
        type: 'incomplete_submissions',
        priority: 'medium',
        title: `${incomplete.length} unvollständige Submissions`,
        description: 'Mehrere Formulare sind noch nicht eingereicht',
        action: 'review_drafts',
        params: { count: incomplete.length }
      });
    }

    // Vorschlag 3: Niedriges KI-Vertrauen
    const lowConfidence = userSubmissions.filter(s => 
      s.ai_confidence_score && s.ai_confidence_score < 75
    );
    if (lowConfidence.length > 0) {
      suggestions.push({
        type: 'low_confidence',
        priority: 'medium',
        title: 'Submissions mit niedrigem KI-Vertrauen',
        description: `${lowConfidence.length} Formulare sollten überprüft werden`,
        action: 'review_low_confidence',
        params: { submissions: lowConfidence.map(s => s.id) }
      });
    }

    // Vorschlag 4: Archivierung alter Daten
    const oldSubmissions = userSubmissions.filter(s => {
      const age = Date.now() - new Date(s.created_date).getTime();
      return age > (365 * 24 * 60 * 60 * 1000) && s.status === 'ACCEPTED';
    });
    if (oldSubmissions.length > 5) {
      suggestions.push({
        type: 'archive_old',
        priority: 'low',
        title: 'Alte Submissions archivieren',
        description: `${oldSubmissions.length} alte akzeptierte Formulare`,
        action: 'bulk_archive',
        params: { count: oldSubmissions.length }
      });
    }

    return Response.json({ success: true, suggestions });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});