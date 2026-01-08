import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await req.json();

    console.log(`[TIMELINE] Generating compliance timeline for ${year}`);

    const deadlines = {
      'ANLAGE_V': { month: 7, day: 31, name: 'Anlage V Abgabe' },
      'EUER': { month: 7, day: 31, name: 'EÜR Abgabe' },
      'UMSATZSTEUER': { month: 1, day: 31, name: 'Umsatzsteuer Voranmeldung (Dez)' },
      'GEWERBESTEUER': { month: 7, day: 31, name: 'Gewerbesteuererklärung' }
    };

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: year
    });

    const timeline = [];

    // Deadlines hinzufügen
    for (const [formType, deadline] of Object.entries(deadlines)) {
      const sub = submissions.find(s => s.tax_form_type === formType);
      const deadlineDate = new Date(year + 1, deadline.month - 1, deadline.day);
      
      timeline.push({
        date: deadlineDate,
        type: 'deadline',
        form_type: formType,
        name: deadline.name,
        status: sub ? 'submitted' : 'pending',
        days_until: Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
      });
    }

    // Submissions hinzufügen
    submissions.forEach(sub => {
      if (sub.submission_date) {
        timeline.push({
          date: new Date(sub.submission_date),
          type: 'submission',
          form_type: sub.tax_form_type,
          name: `${sub.tax_form_type} übermittelt`,
          status: sub.status
        });
      }
    });

    timeline.sort((a, b) => a.date - b.date);

    console.log(`[TIMELINE] Generated ${timeline.length} events`);

    return Response.json({
      success: true,
      timeline
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});