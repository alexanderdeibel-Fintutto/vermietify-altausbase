import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];

    const timeline = [];

    const deadlines = {
      'CH': {
        docs_collect: '31.12',
        docs_deadline: '01.01',
        prelim_check: '01.02',
        filing_deadline: '15.03',
        extension_deadline: null
      },
      'DE': {
        docs_collect: '31.12',
        docs_deadline: '01.01',
        prelim_check: '15.04',
        filing_deadline: '31.05',
        extension_deadline: '31.08'
      },
      'AT': {
        docs_collect: '31.12',
        docs_deadline: '01.01',
        prelim_check: '01.05',
        filing_deadline: '02.06',
        extension_deadline: '31.08'
      }
    };

    // Timeline-Schritte für jedes Land
    for (const country of profile.tax_jurisdictions) {
      const config = deadlines[country];
      
      timeline.push({
        country,
        step: 1,
        title: `Dokumentensammlung ${country}`,
        description: 'Alle erforderlichen Dokumente zusammentragen',
        target_date: `${tax_year}-12-31`,
        priority: 'high',
        action_items: ['Kontoauszüge', 'Handelsbestätigungen', 'Immobilien-Nachweise', 'GmbH-Unterlagen']
      });

      timeline.push({
        country,
        step: 2,
        title: `Vorprüfung ${country}`,
        description: 'Plausibilitätsprüfung und Validierung',
        target_date: `${tax_year + 1}-01-31`,
        priority: 'high',
        action_items: ['Daten validieren', 'Fehlende Dokumente identifizieren', 'Anomalien prüfen']
      });

      timeline.push({
        country,
        step: 3,
        title: `Formularfüllung ${country}`,
        description: 'Steuererklärung ausfüllen',
        target_date: `${tax_year + 1}-02-28`,
        priority: 'medium',
        action_items: ['Formulare generieren', 'Mit Berater abstimmen', 'Unterschriften vorbereiten']
      });

      timeline.push({
        country,
        step: 4,
        title: `FINAL: Einreichung ${country}`,
        description: `Steuererklärung einreichen bis ${config.filing_deadline}`,
        target_date: config.filing_deadline.split('.')[1] === '03' 
          ? `${tax_year + 1}-03-10`
          : `${tax_year + 1}-05-25`,
        priority: 'critical',
        action_items: ['Elektronisch signieren', 'Einreichen', 'Bestätigung archivieren']
      });

      if (config.extension_deadline) {
        timeline.push({
          country,
          step: 5,
          title: `Verlängerungsfrist ${country}`,
          description: 'Verlängerungsmöglichkeit nutzen',
          target_date: config.extension_deadline.split('.')[1] === '08' 
            ? `${tax_year + 1}-08-25`
            : `${tax_year + 1}-08-31`,
          priority: 'low',
          action_items: ['Verlängerungsantrag stellen (falls nötig)']
        });
      }
    }

    // Sortieren nach Datum
    timeline.sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

    return Response.json({
      user_email: user.email,
      tax_year,
      timeline,
      countries: profile.tax_jurisdictions,
      profile_type: profile.profile_type
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});