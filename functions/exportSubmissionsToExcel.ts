import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, tax_year } = await req.json();

    let submissions = [];
    
    if (submission_ids && submission_ids.length > 0) {
      for (const id of submission_ids) {
        const sub = await base44.asServiceRole.entities.ElsterSubmission.get(id);
        if (sub) submissions.push(sub);
      }
    } else if (tax_year) {
      submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({ tax_year });
    } else {
      submissions = await base44.asServiceRole.entities.ElsterSubmission.list();
    }

    // CSV-Format erstellen
    const headers = [
      'ID',
      'Formular-Typ',
      'Steuerjahr',
      'Rechtsform',
      'Status',
      'Erstellt',
      'Übermittelt',
      'KI-Vertrauen',
      'Transfer-Ticket'
    ];

    const rows = submissions.map(sub => [
      sub.id.substring(0, 8),
      sub.tax_form_type,
      sub.tax_year,
      sub.legal_form,
      sub.status,
      sub.created_date ? new Date(sub.created_date).toLocaleDateString('de-DE') : '',
      sub.submission_date ? new Date(sub.submission_date).toLocaleDateString('de-DE') : '',
      sub.ai_confidence_score || '',
      sub.transfer_ticket || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=elster_submissions_${tax_year || 'all'}.csv`
      }
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});