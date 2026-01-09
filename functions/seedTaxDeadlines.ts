import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const taxYear = new Date().getFullYear();
    console.log(`Seeding tax deadlines for ${taxYear}`);

    const deadlines = [
      // Austria
      {
        country: 'AT',
        title: 'Einkommensteuer-Erklärung Frist',
        description: 'Steuererklärung muss bis 30. Juni eingereicht werden',
        deadline_date: `${taxYear + 1}-06-30`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 30
      },
      {
        country: 'AT',
        title: 'Kapitalertragsteuer-Abrechnung',
        description: 'KESt-Jahresabrechnung durch die Kreditinstitute',
        deadline_date: `${taxYear + 1}-01-31`,
        tax_year: taxYear,
        deadline_type: 'documentation',
        priority: 'medium',
        reminder_days_before: 15
      },
      {
        country: 'AT',
        title: 'Vorauszahlung Einkommensteuer',
        description: 'Zahlung der Vorauszahlung für das Folgejahr',
        deadline_date: `${taxYear + 1}-01-15`,
        tax_year: taxYear,
        deadline_type: 'payment',
        priority: 'high',
        reminder_days_before: 7
      },

      // Switzerland
      {
        country: 'CH',
        title: 'Steuererklärung (Bund)',
        description: 'Bundessteuer-Erklärung einreichen',
        deadline_date: `${taxYear + 1}-03-31`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'CH',
        title: 'Kantonale Steuererklärung',
        description: 'Kantonale und Gemeinde-Steuererklärung',
        deadline_date: `${taxYear + 1}-04-15`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 30
      },
      {
        country: 'CH',
        title: 'Verrechnungssteuer-Gutschrift',
        description: 'Einreichung für Verrechnungssteuer-Gutschrift',
        deadline_date: `${taxYear + 1}-05-01`,
        tax_year: taxYear,
        deadline_type: 'claim',
        priority: 'medium',
        reminder_days_before: 14
      },

      // Germany
      {
        country: 'DE',
        title: 'Einkommensteuer-Erklärung',
        description: 'Steuererklärung zum Finanzamt einreichen',
        deadline_date: `${taxYear + 1}-10-02`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'DE',
        title: 'Vorauszahlung Einkommensteuer',
        description: 'Quartalsweise Vorauszahlungen',
        deadline_date: `${taxYear + 1}-01-15`,
        tax_year: taxYear,
        deadline_type: 'payment',
        priority: 'high',
        reminder_days_before: 7
      }
    ];

    const created = [];
    for (const deadline of deadlines) {
      try {
        const result = await base44.asServiceRole.entities.TaxDeadline.create(deadline);
        created.push(result.id);
        console.log(`Created deadline: ${deadline.title}`);
      } catch (error) {
        console.error(`Error creating deadline ${deadline.title}:`, error);
      }
    }

    return Response.json({
      success: true,
      created: created.length,
      total: deadlines.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});