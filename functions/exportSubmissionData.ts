import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, format = 'json' } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids) || submission_ids.length === 0) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[EXPORT] Exporting ${submission_ids.length} submissions in ${format} format`);

    const submissions = [];
    for (const id of submission_ids) {
      const subs = await base44.entities.ElsterSubmission.filter({ id });
      if (subs.length > 0) {
        submissions.push(subs[0]);
      }
    }

    if (submissions.length === 0) {
      return Response.json({ error: 'No submissions found' }, { status: 404 });
    }

    let exportData;
    let contentType;
    let filename;

    if (format === 'csv') {
      // CSV Export
      const headers = [
        'ID', 'Formular-Typ', 'Jahr', 'Status', 'Rechtsform', 
        'Modus', 'KI-Vertrauen', 'Erstellt', 'Eingereicht'
      ];
      
      const rows = submissions.map(s => [
        s.id,
        s.tax_form_type,
        s.tax_year,
        s.status,
        s.legal_form,
        s.submission_mode,
        s.ai_confidence_score || '',
        s.created_date || '',
        s.submission_date || ''
      ]);

      exportData = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
      
      contentType = 'text/csv';
      filename = `elster_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // JSON Export
      exportData = JSON.stringify(submissions, null, 2);
      contentType = 'application/json';
      filename = `elster_export_${new Date().toISOString().split('T')[0]}.json`;
    }

    console.log(`[EXPORT] Complete: ${submissions.length} submissions exported`);

    return new Response(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});