import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, template_name, description } = await req.json();

    console.log(`[TEMPLATE] Creating from submission ${submission_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      id: submission_id
    });

    if (submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submissions[0];

    // Entferne spezifische Werte, behalte Struktur
    const templateData = { ...sub.form_data };
    
    // Setze Werte auf Platzhalter
    Object.keys(templateData).forEach(key => {
      if (key.includes('betrag') || key.includes('summe')) {
        templateData[key] = 0;
      } else if (key.includes('datum')) {
        templateData[key] = '{{current_year}}';
      }
    });

    const template = await base44.asServiceRole.entities.ElsterFormTemplate.create({
      form_type: sub.tax_form_type,
      legal_form: sub.legal_form,
      year: new Date().getFullYear(),
      xml_template: sub.xml_data || '',
      field_mappings: templateData,
      description: description || `Template erstellt aus ${sub.tax_form_type} ${sub.tax_year}`,
      version: '1.0',
      is_active: true
    });

    console.log(`[TEMPLATE] Created ${template.id}`);

    return Response.json({
      success: true,
      template_id: template.id
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});