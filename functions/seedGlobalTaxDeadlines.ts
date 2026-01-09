import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const deadlines = [
      // AUSTRIA
      {
        country: 'AT',
        title: 'Einkommensteuer-Veranlagung (Steuererklärung)',
        deadline_date: '2025-05-31',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['individual'],
        days_before_reminder: [30, 14, 7, 3, 1],
        related_forms: ['Anlage KAP', 'Anlage E1c', 'Anlage SO'],
        extension_possible: true,
        extension_deadline: '2025-06-30',
        late_payment_interest_rate: 0.5
      },
      {
        country: 'AT',
        title: 'Umsatzsteuer-Voranmeldung (monatlich)',
        deadline_date: '2025-02-15',
        deadline_type: 'quarterly_payment',
        priority: 'high',
        applicable_entities: ['business'],
        days_before_reminder: [7, 3]
      },
      {
        country: 'AT',
        title: 'Körperschaftsteuer-Erklärung',
        deadline_date: '2025-06-30',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['corporation']
      },

      // SWITZERLAND
      {
        country: 'CH',
        title: 'Bundessteuer-Erklärung (Steuerjahr 2024)',
        deadline_date: '2025-03-14',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['individual'],
        days_before_reminder: [30, 14, 7, 3],
        related_forms: ['Anlage Wertschriften', 'Anlage Liegenschaft'],
        extension_possible: true,
        extension_deadline: '2025-05-14',
        late_payment_interest_rate: 0.35
      },
      {
        country: 'CH',
        title: 'Kantonale Steuer-Erklärung (variiert nach Kanton)',
        deadline_date: '2025-04-30',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['individual'],
        notes: 'Deadline je nach Kanton verschieden'
      },
      {
        country: 'CH',
        title: 'Vermögenssteuer-Erklärung',
        deadline_date: '2025-03-14',
        tax_year: 2024,
        deadline_type: 'declaration',
        priority: 'high',
        applicable_entities: ['individual']
      },

      // GERMANY
      {
        country: 'DE',
        title: 'Einkommensteuer-Erklärung',
        deadline_date: '2025-05-30',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['individual'],
        days_before_reminder: [30, 14, 7, 3, 1],
        related_forms: ['Anlage SO', 'Anlage KAP', 'Anlage V'],
        extension_possible: true,
        extension_deadline: '2025-07-31',
        late_payment_interest_rate: 0.5
      },
      {
        country: 'DE',
        title: 'Umsatzsteuer-Voranmeldung (monatlich)',
        deadline_date: '2025-02-10',
        deadline_type: 'quarterly_payment',
        priority: 'high',
        applicable_entities: ['business'],
        days_before_reminder: [7, 3]
      },
      {
        country: 'DE',
        title: 'Körperschaftsteuer-Erklärung',
        deadline_date: '2025-07-30',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['corporation']
      },
      {
        country: 'DE',
        title: 'Gewerbesteuer-Voranzahlung (Dezember)',
        deadline_date: '2024-12-15',
        deadline_type: 'advance_payment',
        priority: 'high',
        applicable_entities: ['business']
      },
      {
        country: 'DE',
        title: 'ELSTER-Übermittlung mit Zertifikat',
        deadline_date: '2025-05-31',
        tax_year: 2024,
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['business']
      }
    ];

    let createdCount = 0;
    let errorCount = 0;

    for (const deadline of deadlines) {
      try {
        await base44.asServiceRole.entities.TaxDeadline.create(deadline);
        createdCount++;
      } catch (error) {
        console.error(`Error creating deadline: ${deadline.title}`, error);
        errorCount++;
      }
    }

    return Response.json({
      status: 'success',
      deadlines_created: createdCount,
      errors: errorCount,
      message: `Successfully seeded ${createdCount} tax deadlines`
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});