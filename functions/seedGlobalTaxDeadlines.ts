import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const deadlines = [
      // AUSTRIA
      {
        country: 'AT',
        title: 'Einkommensteuererklärung 2024',
        description: 'Abgabe der Jahressteuererklärung für Einkünfte aus 2024',
        deadline_date: '2025-06-02',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        related_forms: ['Einkünfte', 'Sonderausgaben'],
        extension_possible: true,
        extension_deadline: '2025-12-31',
        late_payment_interest_rate: 0.5
      },
      {
        country: 'AT',
        title: 'Umsatzsteuererklärung (Quartal 1)',
        description: 'Abgabe der Umsatzsteuererklärung für Q1 2025',
        deadline_date: '2025-04-15',
        tax_year: 2025,
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['business'],
        days_before_reminder: [14, 7, 3, 1]
      },
      {
        country: 'AT',
        title: 'Vermögenssteuer Voranmeldung',
        description: 'Voranmeldung für Vermögenssteuer',
        deadline_date: '2025-03-31',
        tax_year: 2025,
        deadline_type: 'declaration',
        priority: 'medium'
      },

      // SWITZERLAND
      {
        country: 'CH',
        title: 'Steuererklärung 2024',
        description: 'Abgabe der kantonalen Steuererklärung',
        deadline_date: '2025-03-15',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        extension_possible: true,
        late_payment_interest_rate: 0.3
      },
      {
        country: 'CH',
        title: 'AHV Beiträge Selbstständige (Q4)',
        description: 'Abgabe AHV-Beiträge für Q4 2024',
        deadline_date: '2025-01-31',
        tax_year: 2024,
        deadline_type: 'payment',
        priority: 'critical',
        applicable_entities: ['business', 'partnership']
      },
      {
        country: 'CH',
        title: 'Mehrwertsteuer Abrechnung (Q4)',
        description: 'Mehrwertsteuer Abrechnung für Q4 2024',
        deadline_date: '2025-02-28',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['business']
      },

      // GERMANY
      {
        country: 'DE',
        title: 'Einkommensteuererklärung 2024',
        description: 'Abgabe der Einkommensteuererklärung',
        deadline_date: '2025-10-02',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        extension_possible: true,
        extension_deadline: '2025-12-31',
        late_payment_interest_rate: 0.6
      },
      {
        country: 'DE',
        title: 'Umsatzsteuererklärung (Quartal 1)',
        description: 'Abgabe der Umsatzsteuererklärung für Q1 2025',
        deadline_date: '2025-04-10',
        tax_year: 2025,
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['business'],
        related_forms: ['USt-VA']
      },
      {
        country: 'DE',
        title: 'Körperschaftsteuererklärung',
        description: 'Abgabe der Körperschaftsteuererklärung 2024',
        deadline_date: '2025-05-31',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['corporation']
      },
      {
        country: 'DE',
        title: 'Gewerbesteuererklärung',
        description: 'Abgabe der Gewerbesteuererklärung 2024',
        deadline_date: '2025-05-15',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['business']
      },
      {
        country: 'DE',
        title: 'Lohnsteuerermäßigung beantragen',
        description: 'Antrag auf Lohnsteuerermäßigung für 2025',
        deadline_date: '2025-03-02',
        tax_year: 2025,
        deadline_type: 'submission',
        priority: 'medium'
      }
    ];

    let created = 0;
    let skipped = 0;

    for (const deadline of deadlines) {
      const existing = await base44.entities.TaxDeadline.filter({
        country: deadline.country,
        title: deadline.title,
        tax_year: deadline.tax_year
      });

      if (existing.length === 0) {
        await base44.entities.TaxDeadline.create(deadline);
        created++;
      } else {
        skipped++;
      }
    }

    return Response.json({
      status: 'success',
      message: `Seeded ${created} deadlines, skipped ${skipped} existing`,
      created,
      skipped
    });
  } catch (error) {
    console.error('Seed deadlines error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});