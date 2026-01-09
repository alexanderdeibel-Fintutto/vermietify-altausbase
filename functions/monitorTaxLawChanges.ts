import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { country } = await req.json();

    if (!country) {
      return Response.json({ error: 'Missing country' }, { status: 400 });
    }

    const taxLawUpdates = {
      AT: [
        {
          title: 'Erhöhung der Freibeträge 2025',
          description: 'Erhöhung der Jahresfreibeträge für Arbeitnehmer um 1.5%',
          category: 'income_tax',
          effective_date: '2025-01-01',
          impact_level: 'medium',
          affected_entities: ['individual'],
          source: 'BMF',
          source_url: 'https://www.bmf.gv.at'
        },
        {
          title: 'Digitalisierungsförderung für KMU',
          description: 'Neue Steuererleichterungen für digitale Transformationen',
          category: 'deduction',
          effective_date: '2025-02-01',
          impact_level: 'high',
          affected_entities: ['business', 'corporation'],
          source: 'BMF',
          source_url: 'https://www.bmf.gv.at'
        }
      ],
      CH: [
        {
          title: 'Änderung der Vermögenssteuer',
          description: 'Neue Bewertungsregeln für Kunstsammlungen',
          category: 'wealth_tax',
          effective_date: '2025-01-01',
          impact_level: 'medium',
          affected_entities: ['individual'],
          source: 'ESTV',
          source_url: 'https://www.estv.admin.ch'
        },
        {
          title: 'Mehrwertsteuersatz Anpassung',
          description: 'Erhöhung des Regelsatzes von 7.7% auf 8.1%',
          category: 'deadline',
          effective_date: '2025-01-01',
          impact_level: 'high',
          affected_entities: ['business'],
          source: 'ESTV',
          source_url: 'https://www.estv.admin.ch'
        }
      ],
      DE: [
        {
          title: 'Erhöhung des Grundfreibetrages',
          description: 'Anpassung des Grundfreibetrages um 300 Euro auf 11.604 Euro',
          category: 'income_tax',
          effective_date: '2025-01-01',
          impact_level: 'medium',
          affected_entities: ['individual'],
          source: 'BMF',
          source_url: 'https://www.bundesfinanzministerium.de'
        },
        {
          title: 'Erbschaft- und Schenkungsteuer Reform',
          description: 'Neue Freibeträge und Steuersätze für 2025',
          category: 'capital_gains',
          effective_date: '2025-01-01',
          impact_level: 'high',
          affected_entities: ['individual'],
          source: 'BMF',
          source_url: 'https://www.bundesfinanzministerium.de'
        }
      ]
    };

    const updates = taxLawUpdates[country] || [];
    let created = 0;
    let skipped = 0;

    for (const update of updates) {
      const existing = await base44.entities.TaxLawUpdate.filter({
        country,
        title: update.title,
        effective_date: update.effective_date
      });

      if (existing.length === 0) {
        await base44.entities.TaxLawUpdate.create({
          country,
          ...update,
          published_date: new Date().toISOString(),
          notification_sent: false,
          is_active: true
        });
        created++;
      } else {
        skipped++;
      }
    }

    return Response.json({
      status: 'success',
      country,
      created,
      skipped,
      updates
    });
  } catch (error) {
    console.error('Monitor tax law changes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});