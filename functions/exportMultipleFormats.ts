import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, format = 'json' } = await req.json();

    if (!submission_ids || submission_ids.length === 0) {
      return Response.json({ error: 'submission_ids required' }, { status: 400 });
    }

    console.log(`[EXPORT] ${submission_ids.length} submissions as ${format}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      id: { $in: submission_ids }
    });

    let exportData;
    let contentType;
    let filename;

    if (format === 'json') {
      exportData = JSON.stringify(submissions, null, 2);
      contentType = 'application/json';
      filename = `elster_export_${Date.now()}.json`;
    } else if (format === 'csv') {
      // CSV-Export
      const headers = ['ID', 'Formular', 'Jahr', 'Status', 'Einnahmen', 'Ausgaben', 'Erstellt'];
      const rows = submissions.map(s => [
        s.id,
        s.tax_form_type,
        s.tax_year,
        s.status,
        s.form_data?.einnahmen_gesamt || 0,
        s.form_data?.werbungskosten_gesamt || 0,
        new Date(s.created_date).toLocaleDateString('de-DE')
      ]);
      
      exportData = [headers, ...rows]
        .map(row => row.join(';'))
        .join('\n');
      
      contentType = 'text/csv';
      filename = `elster_export_${Date.now()}.csv`;
    } else if (format === 'xml') {
      // Kombiniertes XML
      const xmls = submissions
        .filter(s => s.xml_data)
        .map(s => s.xml_data)
        .join('\n\n');
      
      exportData = `<?xml version="1.0" encoding="UTF-8"?>\n<elster_export>\n${xmls}\n</elster_export>`;
      contentType = 'application/xml';
      filename = `elster_export_${Date.now()}.xml`;
    }

    return new Response(exportData, {
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