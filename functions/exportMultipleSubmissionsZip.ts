import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, include_xml = true, include_json = true } = await req.json();

    console.log(`[ZIP-EXPORT] Preparing ${submission_ids.length} submissions`);

    const exports = [];

    for (const id of submission_ids) {
      const subs = await base44.entities.ElsterSubmission.filter({ id });
      if (subs.length === 0) continue;

      const sub = subs[0];
      const exportData = {
        id: sub.id,
        form_type: sub.tax_form_type,
        year: sub.tax_year,
        files: []
      };

      if (include_json) {
        exportData.files.push({
          name: `${sub.tax_form_type}_${sub.tax_year}_data.json`,
          content: JSON.stringify(sub.form_data, null, 2),
          type: 'application/json'
        });
      }

      if (include_xml && sub.xml_data) {
        exportData.files.push({
          name: `${sub.tax_form_type}_${sub.tax_year}_elster.xml`,
          content: sub.xml_data,
          type: 'application/xml'
        });
      }

      exports.push(exportData);
    }

    return Response.json({
      success: true,
      export_count: exports.length,
      total_files: exports.reduce((sum, e) => sum + e.files.length, 0),
      exports
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});