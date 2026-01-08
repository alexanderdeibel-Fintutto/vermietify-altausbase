import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, format } = await req.json();

    if (!submission_id || !format) {
      return Response.json({ error: 'submission_id and format required' }, { status: 400 });
    }

    console.log(`[EXPORT-BUNDLE] Exporting ${submission_id} as ${format}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    if (format === 'json') {
      return Response.json({
        success: true,
        data: sub,
        export_date: new Date().toISOString()
      });
    }

    if (format === 'xml') {
      return new Response(sub.xml_data || '<error>No XML data</error>', {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename=elster_${sub.tax_form_type}_${sub.tax_year}.xml`
        }
      });
    }

    if (format === 'csv') {
      const formData = sub.form_data || {};
      const rows = [
        ['Feld', 'Wert'],
        ...Object.entries(formData).map(([key, value]) => [key, String(value)])
      ];
      
      const csv = rows.map(row => row.join(';')).join('\n');
      
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=elster_${sub.tax_form_type}_${sub.tax_year}.csv`
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});