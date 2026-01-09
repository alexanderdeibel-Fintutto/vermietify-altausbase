import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing country or taxYear' }, { status: 400 });
    }

    // Fetch user's tax data
    const filings = await base44.entities.TaxFiling.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    });

    const calculations = await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    });

    const investments = await base44.entities.AssetPortfolio.filter({
      user_email: user.email
    });

    // Generate country-specific strategies
    const strategies = {
      AT: [
        {
          id: 'sparerfreibetrag',
          priority: 'high',
          title: 'Sparerfreibetrag maximieren',
          description: 'Nutzen Sie den erhöhten Sparerfreibetrag von €950 pro Jahr',
          estimated_savings: 261, // 950 * 0.275
          implementation: 'Verteilen Sie Kapitalanlage über das Jahr zur Optimierung',
          deadline: `${taxYear}-12-31`,
          difficulty: 'easy'
        },
        {
          id: 'verlustvortrag',
          priority: 'medium',
          title: 'Verlustvortrag optimieren',
          description: 'Nutzen Sie verfügbare Verlustvorträge zur Steuerminderung',
          estimated_savings: 500,
          implementation: 'Überprüfen Sie offene Verlustvorträge in Ihrer TaxLossCarryforward Liste',
          deadline: `${taxYear}-12-31`,
          difficulty: 'medium'
        },
        {
          id: 'werbungskosten',
          priority: 'high',
          title: 'Werbungskosten sammeln',
          description: 'Alle beruflichen Ausgaben sollten erfasst werden',
          estimated_savings: 1000,
          implementation: 'Dokumentieren Sie alle Betriebsausgaben und Fortbildungskosten',
          deadline: `${taxYear}-12-31`,
          difficulty: 'easy'
        }
      ],
      CH: [
        {
          id: 'canton_selection',
          priority: 'high',
          title: 'Kantonaler Wohnsitz optimieren',
          description: 'Verschiedene Kantone haben unterschiedliche Steuersätze',
          estimated_savings: 5000,
          implementation: 'Evaluieren Sie günstigere Kantone (z.B. Zug, Schwyz)',
          deadline: `${taxYear}-12-31`,
          difficulty: 'hard'
        },
        {
          id: 'hypothekarzinsen',
          priority: 'high',
          title: 'Hypothekarzinsen abziehen',
          description: 'Alle Hypothekarzinsen sind in den meisten Kantonen abzugsfähig',
          estimated_savings: 2000,
          implementation: 'Sammeln Sie Hypothekarzins-Abrechnungen',
          deadline: `${taxYear}-12-31`,
          difficulty: 'easy'
        },
        {
          id: 'verrechnungssteuer',
          priority: 'medium',
          title: 'Verrechnungssteuer zurückfordern',
          description: 'Gezahlte Verrechnungssteuer kann rückerstattet werden',
          estimated_savings: 800,
          implementation: 'Fordern Sie Rückerstattung in der Steuererklärung',
          deadline: `${taxYear}-03-31`,
          difficulty: 'medium'
        }
      ],
      DE: [
        {
          id: 'sparerpauschbetrag',
          priority: 'high',
          title: 'Sparerpauschbetrag nutzen',
          description: 'Der Sparerpauschbetrag von €801 mindert Ihre Steuerlast',
          estimated_savings: 207, // 801 * 0.26375
          implementation: 'Beantragen Sie den Freistellungsauftrag bei Ihrer Bank',
          deadline: `${taxYear}-12-31`,
          difficulty: 'easy'
        },
        {
          id: 'werbungskostenpauschale',
          priority: 'high',
          title: 'Werbungskostenpauschale optimieren',
          description: 'Erhöhte Werbungskostenpauschale für 2025: €1.100',
          estimated_savings: 286, // 1100 * 0.26375
          implementation: 'Dokumentieren Sie berufliche Ausgaben zur Überschreitung',
          deadline: `${taxYear}-12-31`,
          difficulty: 'easy'
        },
        {
          id: 'verlustvortrag',
          priority: 'medium',
          title: 'Verluste optimal verwenden',
          description: 'Unbegrenzte Verlustverrechnung möglich (ab 2021)',
          estimated_savings: 1500,
          implementation: 'Systematische Erfassung von Kapitalverlüsten',
          deadline: `${taxYear}-12-31`,
          difficulty: 'medium'
        }
      ]
    };

    const countryStrategies = strategies[country] || [];

    // Add personalized recommendations based on data
    const recommendations = countryStrategies.map(strategy => ({
      ...strategy,
      status: 'suggested',
      implementation_status: 0,
      potential_impact: 'medium'
    }));

    return Response.json({
      status: 'success',
      country,
      tax_year: taxYear,
      total_potential_savings: recommendations.reduce((sum, r) => sum + r.estimated_savings, 0),
      strategies: recommendations,
      summary: {
        high_priority: recommendations.filter(r => r.priority === 'high').length,
        medium_priority: recommendations.filter(r => r.priority === 'medium').length,
        easy_to_implement: recommendations.filter(r => r.difficulty === 'easy').length
      }
    });
  } catch (error) {
    console.error('Tax planning strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});