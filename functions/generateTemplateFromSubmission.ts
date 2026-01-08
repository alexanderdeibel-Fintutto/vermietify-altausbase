import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, template_name } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    const template = await base44.entities.ElsterFormTemplate.create({
      form_type: sub.tax_form_type,
      legal_form: sub.legal_form,
      year: sub.tax_year,
      xml_template: sub.xml_data || '',
      field_mappings: sub.form_data || {},
      description: template_name || `Template from ${sub.tax_form_type} ${sub.tax_year}`,
      version: '1.0',
      is_active: true
    });

    return Response.json({ success: true, template });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});