import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenario } = await req.json();

    if (!scenario) {
      return Response.json({ error: 'Missing scenario' }, { status: 400 });
    }

    const { income, investments, wealth, taxYear } = scenario;

    // Simulate tax calculations for each country
    const comparisons = {
      AT: {
        country: 'AT',
        country_name: 'Österreich',
        income_tax_rate: 0.42,
        wealth_tax_rate: 0,
        capital_gains_tax: 0.275, // KESt
        calculation: {
          income_tax: income * 0.42,
          capital_gains_tax: investments * 0.275,
          wealth_tax: 0,
          total_tax: (income * 0.42) + (investments * 0.275),
          effective_rate: ((income * 0.42) + (investments * 0.275)) / (income + investments)
        },
        advantages: [
          'Sparerfreibetrag €950/Jahr',
          '5-Jahres Verlustvortrag',
          'Privatvermögen Exception'
        ],
        disadvantages: [
          'Hohe Spitzensteuersatz (42%)',
          'KESt bei Zinsen (27.5%)',
          'Besteuerung unrealisierte Gewinne'
        ],
        planning_tips: [
          'Nutzen Sie den erhöhten Sparerfreibetrag',
          'Optimieren Sie Verlustvortrag',
          'Consider Privatvermögen-Status'
        ]
      },
      CH: {
        country: 'CH',
        country_name: 'Schweiz',
        income_tax_rate: 0.22, // Average federal + cantonal
        wealth_tax_rate: 0.1,
        capital_gains_tax: 0, // No capital gains tax at federal level
        calculation: {
          income_tax: income * 0.22,
          capital_gains_tax: 0,
          wealth_tax: wealth * 0.001,
          total_tax: (income * 0.22) + (wealth * 0.001),
          effective_rate: ((income * 0.22) + (wealth * 0.001)) / (income + investments)
        },
        advantages: [
          'Keine Kapitalertragsteuer (Bund)',
          'Niedrigere Einkommensteuer',
          'Vermögenssteuer kann optimiert werden'
        ],
        disadvantages: [
          'Kantonal unterschiedliche Steuersätze',
          'Vermögenssteuer vorhanden',
          'Mietwerberechnung'
        ],
        planning_tips: [
          'Wählen Sie optimalen Kanton',
          'Nutzen Sie kantonale Unterschiede',
          'Planen Sie Immobilien-Struktur'
        ]
      },
      DE: {
        country: 'DE',
        country_name: 'Deutschland',
        income_tax_rate: 0.45, // Top rate with solidarity surcharge
        wealth_tax_rate: 0,
        capital_gains_tax: 0.26375, // Including solidarity surcharge
        calculation: {
          income_tax: income * 0.42,
          capital_gains_tax: investments * 0.26375,
          wealth_tax: 0,
          total_tax: (income * 0.42) + (investments * 0.26375),
          effective_rate: ((income * 0.42) + (investments * 0.26375)) / (income + investments)
        },
        advantages: [
          'Sparerpauschbetrag €801',
          'Werbungskostenpauschale',
          'Unbegrenzte Verlustverrechnung'
        ],
        disadvantages: [
          'Hohe Spitzensteuersätze',
          'Solidaritätszuschlag',
          'Komplexe Regelungen'
        ],
        planning_tips: [
          'Maximieren Sie Sparerpauschbetrag',
          'Nutzen Sie Verlustvortrag',
          'Optimieren Sie Besteuerungszeiträume'
        ]
      }
    };

    // Calculate differences and recommendations
    const sorted = Object.values(comparisons).sort((a, b) => 
      a.calculation.total_tax - b.calculation.total_tax
    );

    const savings = {
      most_efficient: sorted[0],
      least_efficient: sorted[sorted.length - 1],
      potential_savings: sorted[sorted.length - 1].calculation.total_tax - sorted[0].calculation.total_tax
    };

    return Response.json({
      status: 'success',
      scenario,
      tax_year: taxYear,
      comparisons,
      sorted_by_efficiency: sorted.map(c => ({
        country: c.country,
        country_name: c.country_name,
        total_tax: c.calculation.total_tax,
        effective_rate: (c.calculation.effective_rate * 100).toFixed(2)
      })),
      savings_analysis: savings,
      recommendation: `${savings.most_efficient.country_name} offers the most favorable tax treatment with potential savings of ${savings.potential_savings.toLocaleString('de-DE')} EUR`
    });
  } catch (error) {
    console.error('International comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});