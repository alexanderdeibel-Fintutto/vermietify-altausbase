import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const taxYear = new Date().getFullYear();
    
    const deadlines = [
      // Austria
      {
        country: 'AT',
        title: 'Einkommensteuer-Voranmeldung Q1',
        description: 'Vierteljährliche Voranmeldung für Selbstständige',
        deadline_date: `${taxYear}-04-15`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 14
      },
      {
        country: 'AT',
        title: 'Körperschaftsteuer-Erklärung',
        description: 'Körperschaftsteuer für juristische Personen fällig',
        deadline_date: `${taxYear}-05-31`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 21
      },
      {
        country: 'AT',
        title: 'Einkommensteuer-Erklärung',
        description: 'Abgabe der Steuererklärung für natürliche Personen',
        deadline_date: `${taxYear}-06-30`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'AT',
        title: 'Vermögensteuer',
        description: 'Vermögensteuer-Anmeldung (falls fällig)',
        deadline_date: `${taxYear}-05-15`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'medium',
        reminder_days_before: 14
      },

      // Switzerland
      {
        country: 'CH',
        title: 'Steuererklärung einreichen',
        description: 'Steuererklärung für Bund und Kantone einreichen',
        deadline_date: `${taxYear}-03-15`,
        tax_year: taxYear - 1,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'CH',
        title: 'Kantonale Steuern bezahlen',
        description: 'Zahlung der kantonalen Einkommens- und Vermögenssteuer',
        deadline_date: `${taxYear}-09-30`,
        tax_year: taxYear,
        deadline_type: 'payment',
        priority: 'high',
        reminder_days_before: 45
      },
      {
        country: 'CH',
        title: 'Bundessteuer bezahlen',
        description: 'Zahlung der Bundessteuer',
        deadline_date: `${taxYear}-10-31`,
        tax_year: taxYear,
        deadline_type: 'payment',
        priority: 'high',
        reminder_days_before: 45
      },

      // Germany
      {
        country: 'DE',
        title: 'Einkommensteuer-Erklärung',
        description: 'Abgabe der Steuererklärung bis 31.05. (mit Steuerberater: 30.09.)',
        deadline_date: `${taxYear}-05-31`,
        tax_year: taxYear - 1,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'DE',
        title: 'Körperschaftsteuer-Erklärung',
        description: 'Für juristische Personen und Kapitalgesellschaften',
        deadline_date: `${taxYear}-05-31`,
        tax_year: taxYear - 1,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 30
      },
      {
        country: 'DE',
        title: 'Gewerbesteuer-Erklärung',
        description: 'Gewerbesteuer-Erklärung einreichen',
        deadline_date: `${taxYear}-05-31`,
        tax_year: taxYear - 1,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 30
      },
      {
        country: 'DE',
        title: 'USt-Voranmeldung',
        description: 'Monatliche oder vierteljährliche Umsatzsteuer-Voranmeldung',
        deadline_date: `${taxYear}-01-10`,
        tax_year: taxYear,
        deadline_type: 'submission',
        priority: 'high',
        reminder_days_before: 7
      }
    ];

    let created = 0;
    let errors = [];

    for (const deadline of deadlines) {
      try {
        await base44.entities.TaxDeadline.create(deadline);
        created++;
      } catch (error) {
        errors.push(`${deadline.country} - ${deadline.title}: ${error.message}`);
      }
    }

    return Response.json({
      status: 'success',
      created,
      total: deadlines.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Deadline seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});