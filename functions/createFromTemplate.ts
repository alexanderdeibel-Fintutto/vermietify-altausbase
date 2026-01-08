import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id, building_id, tax_year } = await req.json();

    if (!template_id || !tax_year) {
      return Response.json({ 
        error: 'template_id and tax_year required' 
      }, { status: 400 });
    }

    console.log(`[CREATE-FROM-TEMPLATE] Using template ${template_id} for year ${tax_year}`);

    const template = await base44.entities.ElsterFormTemplate.filter({ id: template_id });
    
    if (template.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const tpl = template[0];

    // Erstelle neue Submission basierend auf Template
    const newSubmission = await base44.entities.ElsterSubmission.create({
      building_id: building_id || null,
      tax_form_type: tpl.form_type,
      legal_form: tpl.legal_form,
      tax_year,
      submission_mode: 'TEST',
      form_data: { ...tpl.field_mappings },
      status: 'DRAFT'
    });

    // Log
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: newSubmission.id,
      action: 'created_from_template',
      user_id: user.id,
      metadata: {
        template_id,
        template_name: tpl.description,
        tax_year
      }
    });

    console.log(`[CREATE-FROM-TEMPLATE] Created submission ${newSubmission.id}`);

    return Response.json({
      success: true,
      submission: newSubmission
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});