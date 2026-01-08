import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, format = 'xlsx' } = await req.json();

    console.log('[EXCEL-EXPORT] Exporting', submission_ids?.length, 'submissions');

    let submissions;
    if (submission_ids && submission_ids.length > 0) {
      submissions = [];
      for (const id of submission_ids) {
        const subs = await base44.entities.ElsterSubmission.filter({ id });
        if (subs.length > 0) submissions.push(subs[0]);
      }
    } else {
      submissions = await base44.entities.ElsterSubmission.list('-created_date', 1000);
    }

    // CSV-Format generieren
    const headers = [
      'ID', 'Formular', 'Jahr', 'Rechtsform', 'Status', 
      'KI-Vertrauen', 'Erstellt', 'Transfer-Ticket'
    ];

    const rows = submissions.map(sub => [
      sub.id,
      sub.tax_form_type,
      sub.tax_year,
      sub.legal_form,
      sub.status,
      sub.ai_confidence_score || 0,
      new Date(sub.created_date).toISOString(),
      sub.transfer_ticket || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="elster_submissions_${Date.now()}.csv"`
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});