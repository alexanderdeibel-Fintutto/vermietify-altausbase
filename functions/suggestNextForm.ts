import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[SUGGEST] Analyzing user patterns');

    const currentYear = new Date().getFullYear();
    const submissions = await base44.entities.ElsterSubmission.filter({
      created_by: user.email
    });

    if (submissions.length === 0) {
      return Response.json({
        success: true,
        suggestions: [{
          form_type: 'ANLAGE_V',
          reason: 'Häufigste Wahl für Vermietung & Verpachtung',
          priority: 'high'
        }]
      });
    }

    // Analysiere Muster
    const formCounts = {};
    const yearlyForms = {};

    submissions.forEach(sub => {
      formCounts[sub.tax_form_type] = (formCounts[sub.tax_form_type] || 0) + 1;
      
      if (!yearlyForms[sub.tax_year]) {
        yearlyForms[sub.tax_year] = new Set();
      }
      yearlyForms[sub.tax_year].add(sub.tax_form_type);
    });

    const suggestions = [];

    // Prüfe fehlende Formulare für aktuelles Jahr
    const currentYearForms = yearlyForms[currentYear] || new Set();
    const lastYearForms = yearlyForms[currentYear - 1] || new Set();

    lastYearForms.forEach(formType => {
      if (!currentYearForms.has(formType)) {
        suggestions.push({
          form_type: formType,
          reason: `Im Vorjahr eingereicht, noch nicht für ${currentYear} erstellt`,
          priority: 'high',
          year: currentYear
        });
      }
    });

    // Häufig genutzte Formulare
    const mostUsed = Object.entries(formCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (mostUsed && !currentYearForms.has(mostUsed[0])) {
      suggestions.push({
        form_type: mostUsed[0],
        reason: `Ihr am häufigsten genutztes Formular (${mostUsed[1]}x)`,
        priority: 'medium',
        year: currentYear
      });
    }

    console.log(`[SUGGEST] Generated ${suggestions.length} suggestions`);

    return Response.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});