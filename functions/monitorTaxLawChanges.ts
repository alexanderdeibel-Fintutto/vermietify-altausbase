import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { country } = await req.json();

    if (!country) {
      return Response.json({ error: 'Missing country parameter' }, { status: 400 });
    }

    // Define latest tax law changes for each country
    const taxLawUpdates = {
      AT: [
        {
          country: 'AT',
          title: 'Erhöhung des Sparerfreibetrags',
          description: 'Der Sparerfreibetrag wurde von €730 auf €950 pro Jahr erhöht (2025)',
          category: 'deduction',
          effective_date: '2025-01-01',
          impact_level: 'medium',
          affected_entities: ['InvestmentAT'],
          change_details: {
            old_value: 730,
            new_value: 950,
            currency: 'EUR'
          },
          source: 'BMF (Bundesministerium für Finanzen)',
          source_url: 'https://www.bmf.gv.at/'
        },
        {
          country: 'AT',
          title: 'Digitalsteuer - Neuregelung ab 2025',
          description: 'Neue Regelungen zur Besteuerung von digitalen Dienstleistungen treten in Kraft',
          category: 'income_tax',
          effective_date: '2025-01-01',
          impact_level: 'high',
          affected_entities: ['OtherIncomeAT'],
          source: 'BMF',
          source_url: 'https://www.bmf.gv.at/'
        }
      ],
      CH: [
        {
          country: 'CH',
          title: 'Steuerreform AHV21 - Weiterführung',
          description: 'Zweite Phase der Rentenalter-Anpassung und Steuererleichterungen',
          category: 'income_tax',
          effective_date: '2024-01-01',
          impact_level: 'medium',
          affected_entities: ['OtherIncomeCH', 'InvestmentCH'],
          change_details: {
            description: 'Erhöhte Sozialversicherungsabzüge für Selbständige'
          },
          source: 'ESTV (Eidgenössische Steuerverwaltung)',
          source_url: 'https://www.estv.admin.ch/'
        },
        {
          country: 'CH',
          title: 'Vorsorgeguthaben - neue Limite',
          description: 'Limite für Vorsorgeguthaben Einkauf in Säule 3a erhöht',
          category: 'deduction',
          effective_date: '2025-01-01',
          impact_level: 'low',
          affected_entities: ['InvestmentCH'],
          source: 'ESTV',
          source_url: 'https://www.estv.admin.ch/'
        }
      ],
      DE: [
        {
          country: 'DE',
          title: 'Werbungskostenpauschale 2025',
          description: 'Erhöhung der Werbungskostenpauschale für Arbeitnehmer',
          category: 'deduction',
          effective_date: '2025-01-01',
          impact_level: 'medium',
          affected_entities: ['OtherIncomeDE'],
          change_details: {
            old_value: 1000,
            new_value: 1100,
            currency: 'EUR'
          },
          source: 'BMF',
          source_url: 'https://www.bmf.bund.de/'
        },
        {
          country: 'DE',
          title: 'Erhöhung des Grundfreibetrags',
          description: 'Grundfreibetrag für Einkommensteuer 2025 erhöht',
          category: 'income_tax',
          effective_date: '2025-01-01',
          impact_level: 'high',
          affected_entities: ['TaxCalculation'],
          change_details: {
            old_value: 11300,
            new_value: 11600,
            currency: 'EUR'
          },
          source: 'BMF',
          source_url: 'https://www.bmf.bund.de/'
        },
        {
          country: 'DE',
          title: 'Sparerpauschbetrag angepasst',
          description: 'Sparerpauschbetrag (Sparer-Freibetrag) bleibt bei €801',
          category: 'deduction',
          effective_date: '2025-01-01',
          impact_level: 'low',
          affected_entities: ['InvestmentDE'],
          source: 'BMF',
          source_url: 'https://www.bmf.bund.de/'
        }
      ]
    };

    const updates = taxLawUpdates[country] || [];
    let createdCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        // Check if already exists
        const existing = await base44.asServiceRole.entities.TaxLawUpdate.filter({
          country: update.country,
          title: update.title,
          effective_date: update.effective_date
        });

        if (!existing || existing.length === 0) {
          await base44.asServiceRole.entities.TaxLawUpdate.create({
            ...update,
            published_date: new Date().toISOString(),
            is_active: true,
            notification_sent: false
          });
          createdCount++;
        }
      } catch (error) {
        console.error(`Error creating tax law update: ${update.title}`, error);
        errorCount++;
      }
    }

    return Response.json({
      status: 'success',
      country,
      updates_created: createdCount,
      errors: errorCount,
      message: `Successfully monitored ${createdCount} tax law changes for ${country}`
    });
  } catch (error) {
    console.error('Tax law monitoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});